
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Connect to Supabase to get user information
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate date range from timeRange parameter
    const dates = getDateRangeFromString(timeRange || "last_30_days");
    const { startDate, endDate } = dates;
    
    console.log(`Fetching creatives for ad account ${adAccountId} from ${startDate} to ${endDate}`);

    // Connect to Meta Graph API using the environment variable
    const metaApiToken = Deno.env.get("META_API_TOKEN");
    
    if (!metaApiToken) {
      return new Response(
        JSON.stringify({ error: 'META_API_TOKEN not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch creatives from the Meta API
    const creativesResponse = await fetch(
      `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${adAccountId}/adcreatives?fields=id,name,object_story_spec,image_url,thumbnail_url,body,title,status&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${metaApiToken}`,
        },
      }
    );

    if (!creativesResponse.ok) {
      const errorData = await creativesResponse.json();
      console.error('Error from Meta API creatives:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch creatives', details: errorData }),
        { status: creativesResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const creativesData = await creativesResponse.json();
    console.log(`Fetched ${creativesData.data.length} creatives from Meta API`);
    
    // Fetch ads to get metrics for creatives
    const adsResponse = await fetch(
      `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${adAccountId}/ads?fields=creative{id},adset_id,insights.time_range({"since":"${startDate}","until":"${endDate}"}){impressions,clicks,spend,actions,action_values,conversions,ctr},status&limit=100`,
      {
        headers: {
          Authorization: `Bearer ${metaApiToken}`,
        },
      }
    );
    
    let adsData;
    if (adsResponse.ok) {
      adsData = await adsResponse.json();
      console.log(`Fetched ${adsData.data.length} ads from Meta API`);
    } else {
      console.error('Failed to fetch ads data');
      adsData = { data: [] };
    }
    
    // Create a map of creative IDs to their metrics from ads
    const creativeMetricsMap = new Map();
    adsData.data.forEach((ad: any) => {
      if (ad.creative && ad.creative.id && ad.insights && ad.insights.data && ad.insights.data.length > 0) {
        const creativeId = ad.creative.id;
        const insights = ad.insights.data[0];
        
        // If this creative already has metrics, add to them; otherwise, create new entry
        if (creativeMetricsMap.has(creativeId)) {
          const existingMetrics = creativeMetricsMap.get(creativeId);
          creativeMetricsMap.set(creativeId, {
            impressions: (existingMetrics.impressions || 0) + parseInt(insights.impressions || 0),
            clicks: (existingMetrics.clicks || 0) + parseInt(insights.clicks || 0),
            spend: (existingMetrics.spend || 0) + parseFloat(insights.spend || 0),
            conversions: (existingMetrics.conversions || 0) + extractConversions(insights),
            revenue: (existingMetrics.revenue || 0) + extractRevenue(insights),
            status: ad.status
          });
        } else {
          creativeMetricsMap.set(creativeId, {
            impressions: parseInt(insights.impressions || 0),
            clicks: parseInt(insights.clicks || 0),
            spend: parseFloat(insights.spend || 0),
            conversions: extractConversions(insights),
            revenue: extractRevenue(insights),
            status: ad.status
          });
        }
      } else {
        if (ad.creative && ad.creative.id) {
          console.log(`No linked ads found for creative: ${ad.creative.id}`);
        }
      }
    });
    
    console.log(`Linked ${creativeMetricsMap.size} creatives with ads`);
    
    // Process creative data and combine with metrics
    const processedCreatives = await Promise.all(creativesData.data.map(async (creative: any) => {
      // Get metrics for this creative
      const metrics = creativeMetricsMap.get(creative.id) || {
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        revenue: 0,
        status: 'unknown'
      };
      
      // Calculate derived metrics
      const ctr = metrics.impressions > 0 ? metrics.clicks / metrics.impressions : 0;
      const roas = metrics.spend > 0 ? metrics.revenue / metrics.spend : 0;
      
      // Extract proper image URLs
      let url = "";
      let thumbnailUrl = "";
      
      if (creative.object_story_spec && 
          creative.object_story_spec.link_data && 
          creative.object_story_spec.link_data.picture) {
        url = creative.object_story_spec.link_data.picture;
        thumbnailUrl = creative.object_story_spec.link_data.picture;
      } else if (creative.image_url) {
        url = creative.image_url;
        thumbnailUrl = creative.thumbnail_url || creative.image_url;
      } else if (creative.thumbnail_url) {
        url = creative.thumbnail_url;
        thumbnailUrl = creative.thumbnail_url;
      }
      
      // Determine creative type
      const type = determineCreativeType(creative);
      
      // Determine performance score (1.0 is average, above is better)
      const performance = calculatePerformance(metrics, type);
      
      // Get existing tags for the creative from the database
      let existingTags: string[] = [];
      try {
        const { data: tagsData } = await supabaseAdmin
          .from('creative_tags')
          .select('tags')
          .eq('creative_id', creative.id)
          .eq('user_id', user.id)
          .single();
          
        if (tagsData && tagsData.tags) {
          existingTags = tagsData.tags;
        }
      } catch (error) {
        console.error(`Error fetching tags for creative ${creative.id}:`, error);
      }
      
      // Clean up creative name - remove random IDs at the end
      const cleanedName = cleanCreativeName(creative.name);
      
      // Return processed creative with metrics and tags
      return {
        id: creative.id,
        name: cleanedName,
        type: type,
        url: url,
        thumbnailUrl: thumbnailUrl,
        performance: performance,
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        ctr: ctr,
        conversions: metrics.conversions,
        cost_per_action: metrics.conversions > 0 ? metrics.spend / metrics.conversions : 0,
        spend: metrics.spend,
        revenue: metrics.revenue,
        roas: roas,
        startDate: getFormattedDate(new Date(startDate)),
        endDate: getFormattedDate(new Date(endDate)),
        themes: existingTags.length > 0 ? existingTags : ["Other"],
        status: metrics.status?.toLowerCase() || creative.status?.toLowerCase() || "unknown",
        aiInsightsCount: Math.floor(Math.random() * 6) // Temporary random insights count
      };
    }));
    
    console.log(`Processed ${processedCreatives.length} creatives`);

    return new Response(
      JSON.stringify({ creatives: processedCreatives }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-meta-creatives function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function getDateRangeFromString(timeRange: string): { startDate: string; endDate: string } {
  const today = new Date();
  let startDate: Date;
  
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

function extractConversions(insights: any): number {
  if (!insights.actions) return 0;
  
  // Look for lead or purchase actions
  const conversionAction = insights.actions.find((action: any) => 
    action.action_type === 'offsite_conversion.fb_pixel_lead' ||
    action.action_type === 'lead' ||
    action.action_type === 'offsite_conversion.fb_pixel_purchase' ||
    action.action_type === 'purchase'
  );
  
  return conversionAction ? parseInt(conversionAction.value) : 0;
}

function extractRevenue(insights: any): number {
  if (!insights.action_values) return 0;
  
  // Look for revenue from purchases
  const revenueAction = insights.action_values.find((action: any) => 
    action.action_type === 'offsite_conversion.fb_pixel_purchase' ||
    action.action_type === 'purchase'
  );
  
  return revenueAction ? parseFloat(revenueAction.value) : 0;
}

function determineCreativeType(creative: any): "image" | "video" {
  // Check if this is a video creative
  if (creative.object_story_spec && 
      creative.object_story_spec.video_data) {
    return "video";
  }
  
  // Default to image
  return "image";
}

function calculatePerformance(metrics: any, type: string): number {
  // This would normally use industry benchmarks and historical data
  // For now, use a simple algorithm based on CTR and conversion rate
  const ctr = metrics.impressions > 0 ? metrics.clicks / metrics.impressions : 0;
  const convRate = metrics.clicks > 0 ? metrics.conversions / metrics.clicks : 0;
  
  // Get average CTR based on creative type (placeholder values)
  const avgCtr = type === "video" ? 0.01 : 0.02;
  const avgConvRate = 0.1;
  
  // Calculate performance relative to averages
  const ctrPerformance = avgCtr > 0 ? ctr / avgCtr : 1;
  const convPerformance = avgConvRate > 0 ? convRate / avgConvRate : 1;
  
  // Weight CTR and conversion rate differently
  return (ctrPerformance * 0.4) + (convPerformance * 0.6);
}

function getFormattedDate(date: Date): string {
  return date.toISOString();
}

function cleanCreativeName(name: string): string {
  // Remove date and hash pattern often found at the end of Meta creative names
  // Example: "Ad name 2024-11-25-7e04f056fa1e5aaff3b3bb5e41882949"
  return name.replace(/\s\d{4}-\d{2}-\d{2}-[0-9a-f]{32}$/, "");
}
