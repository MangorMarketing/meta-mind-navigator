
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DateRanges {
  [key: string]: { since: string; until: string };
}

serve(async (req) => {
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

    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get the JWT from the auth header
    const token = authHeader.replace('Bearer ', '');

    // Verify and decode the JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token', details: userError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body for adAccountId and timeRange if present
    let specificAdAccountId: string | undefined;
    let timeRange: string = 'last_30_days';
    
    if (req.headers.get('content-type')?.includes('application/json')) {
      try {
        const requestBody = await req.json();
        specificAdAccountId = requestBody.adAccountId;
        
        // Handle timeRange if provided
        if (requestBody.timeRange) {
          timeRange = requestBody.timeRange;
        }
      } catch (e) {
        console.log('No request body or invalid JSON');
      }
    }
    
    // Get the user's Meta connection
    const { data: metaConnection, error: metaError } = await supabaseClient
      .from('meta_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (metaError || !metaConnection) {
      console.log('No Meta connection found for user', user.id);
      
      return new Response(
        JSON.stringify({ 
          error: 'No Meta connection found',
          message: 'Please connect your Meta account first' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if token is expired
    const now = new Date();
    const tokenExpiresAt = metaConnection.token_expires_at ? new Date(metaConnection.token_expires_at) : null;
    
    if (tokenExpiresAt && now > tokenExpiresAt) {
      return new Response(
        JSON.stringify({ 
          error: 'Meta access token expired', 
          message: 'Your Meta connection has expired. Please reconnect your account.' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get access token from connection
    const META_API_TOKEN = metaConnection.access_token;
    
    if (!META_API_TOKEN) {
      return new Response(
        JSON.stringify({ 
          error: 'No Meta API token available',
          message: 'Please reconnect your Meta account' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Use the specific ad account ID if provided, otherwise use the one from meta_connection
    const adAccountId = specificAdAccountId || metaConnection.ad_account_id;
    
    // If we still don't have an ad account ID, try to fetch one
    if (!adAccountId) {
      console.log('No ad account ID found, fetching ad accounts');
      // Get list of ad accounts the user has access to
      const adAccountsResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/adaccounts?fields=name,account_id&access_token=${META_API_TOKEN}`,
        { method: 'GET' }
      );
      
      const adAccountsData = await adAccountsResponse.json();
      
      if (adAccountsData.error) {
        console.error('Error fetching Meta ad accounts:', adAccountsData.error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to fetch Meta ad accounts', 
            details: adAccountsData.error 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Use the first ad account if available
      if (adAccountsData.data && adAccountsData.data.length > 0) {
        const firstAdAccountId = adAccountsData.data[0].id;
        console.log('Found ad account ID:', firstAdAccountId);
        
        // Update the user's meta_connection with this ad account ID if not using a temporary one
        if (!specificAdAccountId) {
          await supabaseClient
            .from('meta_connections')
            .update({ ad_account_id: firstAdAccountId })
            .eq('id', metaConnection.id);
        }
      } else {
        console.log('No ad accounts found');
        return new Response(
          JSON.stringify({ 
            error: 'No ad accounts found', 
            message: 'Your Meta account does not have access to any ad accounts' 
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Fetching campaigns for ad account:', adAccountId);
    console.log('Using time range:', timeRange);
    
    // Calculate date ranges based on the selected timeRange
    const today = new Date();
    let since: string, until: string;
    
    const dateRanges: DateRanges = {
      'today': {
        since: today.toISOString().split('T')[0],
        until: today.toISOString().split('T')[0]
      },
      'yesterday': {
        since: new Date(today.getTime() - 86400000).toISOString().split('T')[0],
        until: new Date(today.getTime()).toISOString().split('T')[0]
      },
      'last_7_days': {
        since: new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0],
        until: today.toISOString().split('T')[0]
      },
      'last_30_days': {
        since: new Date(today.getTime() - 30 * 86400000).toISOString().split('T')[0],
        until: today.toISOString().split('T')[0]
      },
      'last_90_days': {
        since: new Date(today.getTime() - 90 * 86400000).toISOString().split('T')[0],
        until: today.toISOString().split('T')[0]
      }
    };
    
    // Get the date range based on the selected timeRange
    if (dateRanges[timeRange]) {
      since = dateRanges[timeRange].since;
      until = dateRanges[timeRange].until;
    } else {
      // Default to last 30 days
      since = new Date(today.getTime() - 30 * 86400000).toISOString().split('T')[0];
      until = today.toISOString().split('T')[0];
    }
    
    console.log(`Date range: ${since} to ${until}`);
    
    // Fetch campaigns for the ad account with time range
    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/campaigns?fields=name,status,objective,budget_remaining,spend,insights{ctr,impressions,reach,clicks,cpc,cpm,cost_per_conversion,conversions,spend,actions,conversion_values,cost_per_action_type}&time_range={"since":"${since}","until":"${until}"}&access_token=${META_API_TOKEN}`,
      { method: 'GET' }
    );
    
    const campaignsData = await campaignsResponse.json();
    
    if (campaignsData.error) {
      console.error('Error fetching Meta campaigns:', campaignsData.error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch Meta campaigns', 
          details: campaignsData.error 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Received ${campaignsData.data?.length || 0} campaigns from Meta API`);
    console.log('Campaign data sample:', JSON.stringify(campaignsData.data?.[0] || {}));
    
    // If there are no campaigns, return an empty array with zero insights
    if (!campaignsData.data || campaignsData.data.length === 0) {
      return new Response(
        JSON.stringify({
          campaigns: [],
          insights: {
            totalSpent: 0,
            totalResults: 0,
            totalRevenue: 0,
            averageCPA: 0,
            averageROI: 0
          },
          dailyData: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get summary insights for the account level directly from the Insights API
    const accountInsightsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/insights?fields=spend,actions,impressions,reach,clicks,ctr,cpc,cpm,cost_per_action_type,conversion_values&time_range={"since":"${since}","until":"${until}"}&access_token=${META_API_TOKEN}`,
      { method: 'GET' }
    );
    
    const accountInsightsData = await accountInsightsResponse.json();
    let accountLevelSpend = 0;
    let accountLevelResults = 0;
    let accountLevelRevenue = 0;
    let accountLevelCPA = 0;
    
    // Parse account level metrics if available
    if (!accountInsightsData.error && accountInsightsData.data && accountInsightsData.data.length > 0) {
      accountLevelSpend = parseFloat(accountInsightsData.data[0].spend || '0');
      
      // Parse conversions from actions array if it exists
      if (accountInsightsData.data[0].actions) {
        const purchaseActions = accountInsightsData.data[0].actions.find(
          (action: any) => action.action_type === 'purchase' || action.action_type === 'offsite_conversion.fb_pixel_purchase'
        );
        
        if (purchaseActions) {
          accountLevelResults = parseInt(purchaseActions.value || '0');
        }
        
        // If no purchase actions found, look for leads instead
        if (accountLevelResults === 0) {
          const leadActions = accountInsightsData.data[0].actions.find(
            (action: any) => action.action_type === 'lead' || action.action_type === 'offsite_conversion.fb_pixel_lead'
          );
          
          if (leadActions) {
            accountLevelResults = parseInt(leadActions.value || '0');
          }
        }
      }
      
      // Parse revenue from conversion_values
      if (accountInsightsData.data[0].conversion_values) {
        const purchaseValue = accountInsightsData.data[0].conversion_values.find(
          (value: any) => value.action_type === 'purchase' || value.action_type === 'offsite_conversion.fb_pixel_purchase'
        );
        
        if (purchaseValue) {
          accountLevelRevenue = parseFloat(purchaseValue.value || '0');
        }
      }
      
      // Parse cost per action
      if (accountInsightsData.data[0].cost_per_action_type) {
        const purchaseCPA = accountInsightsData.data[0].cost_per_action_type.find(
          (cpa: any) => cpa.action_type === 'purchase' || cpa.action_type === 'offsite_conversion.fb_pixel_purchase'
        );
        
        if (purchaseCPA) {
          accountLevelCPA = parseFloat(purchaseCPA.value || '0');
        }
        
        // If no purchase CPA found, look for lead CPA
        if (accountLevelCPA === 0) {
          const leadCPA = accountInsightsData.data[0].cost_per_action_type.find(
            (cpa: any) => cpa.action_type === 'lead' || cpa.action_type === 'offsite_conversion.fb_pixel_lead'
          );
          
          if (leadCPA) {
            accountLevelCPA = parseFloat(leadCPA.value || '0');
          }
        }
      }
    }
    
    // Transform the campaign data to match our expected format
    const processedCampaigns = campaignsData.data.map((campaign: any) => {
      const insights = campaign.insights?.data?.[0] || {};
      let conversions = 0;
      let spent = 0;
      let revenue = 0;
      let costPerAction = 0;
      
      // Parse spend (ensure it's not undefined or null)
      if (campaign.spend) {
        spent = parseFloat(campaign.spend);
      } else if (insights.spend) {
        spent = parseFloat(insights.spend);
      }
      
      // Handle different conversion formats from the API
      if (insights.actions) {
        // Find purchase actions
        const purchaseActions = insights.actions.find(
          (action: any) => action.action_type === 'purchase' || action.action_type === 'offsite_conversion.fb_pixel_purchase'
        );
        
        if (purchaseActions) {
          conversions = parseInt(purchaseActions.value || '0');
        } else {
          // Try to find lead actions if no purchases
          const leadActions = insights.actions.find(
            (action: any) => action.action_type === 'lead' || action.action_type === 'offsite_conversion.fb_pixel_lead'
          );
          
          if (leadActions) {
            conversions = parseInt(leadActions.value || '0');
          }
        }
      }
      
      // Parse revenue from conversion_values
      if (insights.conversion_values) {
        const purchaseValue = insights.conversion_values.find(
          (value: any) => value.action_type === 'purchase' || value.action_type === 'offsite_conversion.fb_pixel_purchase'
        );
        
        if (purchaseValue) {
          revenue = parseFloat(purchaseValue.value || '0');
        }
      }
      
      // If no direct revenue data, estimate from conversions
      if (revenue === 0 && conversions > 0) {
        // Check campaign objective to determine if lead or purchase focused
        if (campaign.objective && 
            (campaign.objective.includes('LEAD') || 
             campaign.objective.includes('MESSAGES'))) {
          // For lead campaigns, assume $50 per lead
          revenue = conversions * 50;
        } else {
          // For other campaigns, assume $100 per conversion
          revenue = conversions * 100;
        }
      }
      
      // Parse cost per action
      if (insights.cost_per_action_type) {
        const purchaseCPA = insights.cost_per_action_type.find(
          (cpa: any) => cpa.action_type === 'purchase' || cpa.action_type === 'offsite_conversion.fb_pixel_purchase'
        );
        
        if (purchaseCPA) {
          costPerAction = parseFloat(purchaseCPA.value || '0');
        } else {
          // Try to find lead CPA if no purchase CPA
          const leadCPA = insights.cost_per_action_type.find(
            (cpa: any) => cpa.action_type === 'lead' || cpa.action_type === 'offsite_conversion.fb_pixel_lead'
          );
          
          if (leadCPA) {
            costPerAction = parseFloat(leadCPA.value || '0');
          }
        }
      }
      
      const results = conversions;
      const ctr = parseFloat(insights.ctr || '0');
      const impressions = parseInt(insights.impressions || '0');
      const reach = parseInt(insights.reach || '0');
      const clicks = parseInt(insights.clicks || '0');
      const cpc = parseFloat(insights.cpc || '0');
      const cpm = parseFloat(insights.cpm || '0');
      const cpa = costPerAction > 0 ? costPerAction : (results > 0 ? spent / results : 0);
      const roi = spent > 0 ? revenue / spent : 0;
      
      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        budget: parseFloat(campaign.budget_remaining || '0') + spent,
        spent: spent,
        results: results,
        cpa: cpa,
        roi: roi,
        objective: campaign.objective,
        ctr: ctr,
        impressions: impressions,
        reach: reach,
        clicks: clicks,
        cpc: cpc,
        cpm: cpm,
        revenue: revenue
      };
    });
    
    // Calculate aggregate insights from the processed campaigns
    const totalSpent = accountLevelSpend > 0 ? accountLevelSpend : 
      processedCampaigns.reduce((sum, campaign) => sum + campaign.spent, 0);
      
    const totalResults = accountLevelResults > 0 ? accountLevelResults :
      processedCampaigns.reduce((sum, campaign) => sum + campaign.results, 0);
      
    // Calculate total revenue - prefer account level if available
    const totalRevenue = accountLevelRevenue > 0 ? accountLevelRevenue :
      processedCampaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);
      
    const averageCPA = accountLevelCPA > 0 ? accountLevelCPA :
      (totalResults > 0 ? totalSpent / totalResults : 0);
      
    const averageROI = totalSpent > 0 ? totalRevenue / totalSpent : 0;
    
    // Fetch daily data for performance chart
    const dailyInsightsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/insights?fields=spend,actions,impressions,clicks,conversion_values,cost_per_action_type&time_increment=1&time_range={"since":"${since}","until":"${until}"}&access_token=${META_API_TOKEN}`,
      { method: 'GET' }
    );
    
    const dailyInsightsData = await dailyInsightsResponse.json();
    let dailyPerformance: any[] = [];
    
    if (!dailyInsightsData.error && dailyInsightsData.data && dailyInsightsData.data.length > 0) {
      dailyPerformance = dailyInsightsData.data.map((day: any) => {
        // Extract purchase or lead actions
        let dayResults = 0;
        let dayRevenue = 0;
        
        if (day.actions) {
          const purchaseActions = day.actions.find(
            (action: any) => action.action_type === 'purchase' || action.action_type === 'offsite_conversion.fb_pixel_purchase'
          );
          
          if (purchaseActions) {
            dayResults = parseInt(purchaseActions.value || '0');
          }
          
          // If no purchase actions found, look for leads
          if (dayResults === 0) {
            const leadActions = day.actions.find(
              (action: any) => action.action_type === 'lead' || action.action_type === 'offsite_conversion.fb_pixel_lead'
            );
            
            if (leadActions) {
              dayResults = parseInt(leadActions.value || '0');
            }
          }
        }
        
        // Parse revenue from conversion_values
        if (day.conversion_values) {
          const purchaseValue = day.conversion_values.find(
            (value: any) => value.action_type === 'purchase' || value.action_type === 'offsite_conversion.fb_pixel_purchase'
          );
          
          if (purchaseValue) {
            dayRevenue = parseFloat(purchaseValue.value || '0');
          }
        }
        
        // If no direct revenue data, estimate from conversions
        if (dayRevenue === 0 && dayResults > 0) {
          // For lead campaigns, assume $50 per lead (simple estimation)
          // For purchase campaigns, assume $100 per conversion
          dayRevenue = dayResults * 100;  // Default to $100 per conversion/lead
        }
        
        const daySpend = parseFloat(day.spend || '0');
        const dayRoas = daySpend > 0 ? dayRevenue / daySpend : 0;
        
        // Get cost per action if available
        let dayCpa = 0;
        if (day.cost_per_action_type) {
          const purchaseCPA = day.cost_per_action_type.find(
            (cpa: any) => cpa.action_type === 'purchase' || cpa.action_type === 'offsite_conversion.fb_pixel_purchase'
          );
          
          if (purchaseCPA) {
            dayCpa = parseFloat(purchaseCPA.value || '0');
          } else {
            // Try to find lead CPA if no purchase CPA
            const leadCPA = day.cost_per_action_type.find(
              (cpa: any) => cpa.action_type === 'lead' || cpa.action_type === 'offsite_conversion.fb_pixel_lead'
            );
            
            if (leadCPA) {
              dayCpa = parseFloat(leadCPA.value || '0');
            }
          }
        }
        
        // If still no CPA but we have spend and conversions, calculate it
        if (dayCpa === 0 && dayResults > 0 && daySpend > 0) {
          dayCpa = daySpend / dayResults;
        }
        
        return {
          date: day.date_start,
          spend: daySpend,
          revenue: dayRevenue,
          roas: dayRoas,
          cpa: dayCpa,
          impressions: parseInt(day.impressions || '0'),
          clicks: parseInt(day.clicks || '0'),
          conversions: dayResults
        };
      });
    }
    
    const responseData = {
      campaigns: processedCampaigns,
      insights: {
        totalSpent,
        totalResults,
        totalRevenue,
        averageCPA,
        averageROI
      },
      dailyData: dailyPerformance
    };

    return new Response(
      JSON.stringify(responseData),
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
