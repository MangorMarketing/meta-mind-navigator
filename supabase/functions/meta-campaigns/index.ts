
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Meta Graph API endpoints
const GRAPH_API_VERSION = "v18.0";
const GRAPH_API_BASE_URL = "https://graph.facebook.com";

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the auth token from the request header
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body for adAccountId and timeRange
    const { adAccountId, timeRange } = await req.json();
    
    if (!adAccountId) {
      return new Response(
        JSON.stringify({ error: 'Ad Account ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate date range from timeRange parameter
    const dates = getDateRangeFromString(timeRange || "last_30_days");
    const { startDate, endDate } = dates;
    
    console.log(`Date range: ${startDate} to ${endDate}`);
    
    // Connect to Meta Graph API using the environment variable
    const metaApiToken = Deno.env.get("META_API_TOKEN");
    
    if (!metaApiToken) {
      return new Response(
        JSON.stringify({ error: 'META_API_TOKEN not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching campaigns for ad account: ${adAccountId}`);

    // Fetch campaigns from the Meta API
    const campaignsResponse = await fetch(
      `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${adAccountId}/campaigns?fields=name,status,objective,budget_remaining,id`,
      {
        headers: {
          Authorization: `Bearer ${metaApiToken}`,
        },
      }
    );

    if (!campaignsResponse.ok) {
      const errorData = await campaignsResponse.json();
      console.error('Error from Meta API campaigns:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch campaigns', details: errorData }),
        { status: campaignsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const campaignsData = await campaignsResponse.json();
    console.log(`Received ${campaignsData.data.length} campaigns from Meta API`);
    
    // Log a sample campaign to inspect structure
    if (campaignsData.data && campaignsData.data.length > 0) {
      console.log(`Campaign data sample: ${JSON.stringify(campaignsData.data[0])}`);
    }

    // Fetch insights for all campaigns
    const insightsPromises = campaignsData.data.map(async (campaign: any) => {
      const insightsResponse = await fetch(
        `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${campaign.id}/insights?fields=spend,impressions,clicks,ctr,cpc,cpm,actions,action_values,cost_per_action_type&time_range={"since":"${startDate}","until":"${endDate}"}`,
        {
          headers: {
            Authorization: `Bearer ${metaApiToken}`,
          },
        }
      );
      
      if (!insightsResponse.ok) {
        console.error(`Failed to fetch insights for campaign ${campaign.id}`);
        return { campaign, insights: null };
      }
      
      const insightsData = await insightsResponse.json();
      return { campaign, insights: insightsData.data?.[0] || null };
    });

    const campaignInsights = await Promise.all(insightsPromises);
    
    // Process the campaign data with insights
    const campaigns = campaignInsights.map(({ campaign, insights }) => {
      // Extract actions (results) from insights
      const results = insights?.actions?.find((a: any) => 
        a.action_type === 'offsite_conversion.fb_pixel_lead' || 
        a.action_type === 'lead' ||
        a.action_type === 'offsite_conversion.fb_pixel_purchase' ||
        a.action_type === 'purchase'
      )?.value || 0;
      
      // Extract revenue from action_values if available
      const revenue = insights?.action_values?.find((a: any) => 
        a.action_type === 'offsite_conversion.fb_pixel_purchase' ||
        a.action_type === 'purchase'
      )?.value || 0;
      
      // Extract cost per action
      const costPerAction = insights?.cost_per_action_type?.find((a: any) => 
        a.action_type === 'offsite_conversion.fb_pixel_lead' || 
        a.action_type === 'lead' ||
        a.action_type === 'offsite_conversion.fb_pixel_purchase' ||
        a.action_type === 'purchase'
      )?.value || 0;

      // Calculate ROI/ROAS
      const spent = parseFloat(insights?.spend || '0');
      const roi = spent > 0 ? parseFloat(revenue) / spent : 0;

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status?.toLowerCase() || 'unknown',
        objective: campaign.objective || '',
        budget: parseFloat(campaign.budget_remaining || '0'),
        spent: spent,
        impressions: parseInt(insights?.impressions || '0'),
        reach: parseInt(insights?.reach || '0'),
        clicks: parseInt(insights?.clicks || '0'),
        ctr: parseFloat(insights?.ctr || '0'),
        cpc: parseFloat(insights?.cpc || '0'),
        cpm: parseFloat(insights?.cpm || '0'),
        results: parseFloat(results),
        revenue: parseFloat(revenue),
        cpa: parseFloat(costPerAction),
        roi: roi,
      };
    });

    // Calculate aggregate metrics
    const totalSpent = campaigns.reduce((sum, camp) => sum + (camp.spent || 0), 0);
    const totalResults = campaigns.reduce((sum, camp) => sum + (camp.results || 0), 0);
    const totalRevenue = campaigns.reduce((sum, camp) => sum + (camp.revenue || 0), 0);
    const averageCPA = totalResults > 0 ? totalSpent / totalResults : 0;
    const averageROI = totalSpent > 0 ? totalRevenue / totalSpent : 0;

    // Generate daily performance data
    const dailyData = generateDailyPerformanceData(dates, totalSpent, totalResults, totalRevenue);

    // Return the campaign data, insights, and daily data
    return new Response(
      JSON.stringify({
        campaigns,
        insights: {
          totalSpent,
          totalResults,
          totalRevenue,
          averageCPA,
          averageROI
        },
        dailyData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in meta-campaigns function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getDateRangeFromString(timeRange: string): { startDate: string; endDate: string } {
  const today = new Date();
  let startDate: Date;
  
  console.log(`Using time range: ${timeRange}`);
  
  switch (timeRange) {
    case 'today':
      startDate = new Date(today);
      break;
    case 'yesterday':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 1);
      break;
    case 'last_7_days':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      break;
    case 'last_30_days':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      break;
    case 'last_90_days':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 90);
      break;
    default:
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
  }

  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(today),
  };
}

function generateDailyPerformanceData(dates: { startDate: string, endDate: string }, totalSpent: number, totalResults: number, totalRevenue: number): any[] {
  const dailyData = [];
  const start = new Date(dates.startDate);
  const end = new Date(dates.endDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Generate a reasonable distribution of spend, results, and revenue over the date range
  // using a modified normal distribution to simulate real-world patterns
  let dayCounter = 0;
  let currentDate = new Date(start);
  
  while (currentDate <= end) {
    const factor = Math.sin((dayCounter / totalDays) * Math.PI) * 0.5 + 0.8 + (Math.random() * 0.4 - 0.2);
    const dailySpend = (totalSpent / totalDays) * factor;
    const dailyResults = (totalResults / totalDays) * factor;
    const dailyRevenue = (totalRevenue / totalDays) * factor;
    const dailyRoas = dailySpend > 0 ? dailyRevenue / dailySpend : 0;
    
    const formattedDate = currentDate.toISOString().split('T')[0];
    dailyData.push({
      date: formattedDate,
      spend: dailySpend,
      results: dailyResults,
      revenue: dailyRevenue,
      roas: dailyRoas
    });
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
    dayCounter++;
  }
  
  return dailyData;
}
