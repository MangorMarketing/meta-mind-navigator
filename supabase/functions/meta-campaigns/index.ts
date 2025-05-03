
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
        since: new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0],
        until: new Date(today.setDate(today.getDate())).toISOString().split('T')[0]
      },
      'last_7_days': {
        since: new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0],
        until: new Date().toISOString().split('T')[0]
      },
      'last_30_days': {
        since: new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0],
        until: new Date().toISOString().split('T')[0]
      },
      'last_90_days': {
        since: new Date(today.setDate(today.getDate() - 90)).toISOString().split('T')[0],
        until: new Date().toISOString().split('T')[0]
      }
    };
    
    // Get the date range based on the selected timeRange
    if (dateRanges[timeRange]) {
      since = dateRanges[timeRange].since;
      until = dateRanges[timeRange].until;
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      since = thirtyDaysAgo.toISOString().split('T')[0];
      until = today.toISOString().split('T')[0];
    }
    
    console.log(`Date range: ${since} to ${until}`);
    
    // Fetch campaigns for the ad account with time range
    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/campaigns?fields=name,status,objective,budget_remaining,spend,insights{ctr,impressions,reach,clicks,cpc,cpm,cost_per_conversion,conversions}&time_range={"since":"${since}","until":"${until}"}&access_token=${META_API_TOKEN}`,
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
    
    // If there are no campaigns, return an empty array with zero insights
    if (!campaignsData.data || campaignsData.data.length === 0) {
      return new Response(
        JSON.stringify({
          campaigns: [],
          insights: {
            totalSpent: 0,
            totalResults: 0,
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
      `https://graph.facebook.com/v18.0/${adAccountId}/insights?fields=spend,actions,impressions,reach,clicks,ctr,cpc,cpm&time_range={"since":"${since}","until":"${until}"}&access_token=${META_API_TOKEN}`,
      { method: 'GET' }
    );
    
    const accountInsightsData = await accountInsightsResponse.json();
    let accountLevelSpend = 0;
    let accountLevelResults = 0;
    
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
    }
    
    // Transform the campaign data to match our expected format
    const processedCampaigns = campaignsData.data.map((campaign: any) => {
      const insights = campaign.insights?.data?.[0] || {};
      let conversions = 0;
      
      // Handle different conversion formats from the API
      if (insights.conversions) {
        if (Array.isArray(insights.conversions.actions)) {
          conversions = insights.conversions.actions.reduce(
            (sum: number, action: any) => sum + (parseInt(action.value) || 0), 0
          );
        } else if (typeof insights.conversions === 'object') {
          // Try to find purchase or lead conversions
          const purchaseValue = insights.conversions['purchase'] || insights.conversions['offsite_conversion.fb_pixel_purchase'];
          const leadValue = insights.conversions['lead'] || insights.conversions['offsite_conversion.fb_pixel_lead'];
          
          if (purchaseValue) conversions = parseInt(purchaseValue);
          else if (leadValue) conversions = parseInt(leadValue);
        }
      }
      
      // Parse spend (ensure it's not undefined or null)
      const spent = parseFloat(campaign.spend || insights.spend || '0');
      const results = conversions;
      const ctr = parseFloat(insights.ctr || '0');
      const impressions = parseInt(insights.impressions || '0');
      const reach = parseInt(insights.reach || '0');
      const clicks = parseInt(insights.clicks || '0');
      const cpc = parseFloat(insights.cpc || '0');
      const cpm = parseFloat(insights.cpm || '0');
      const cpa = results > 0 ? spent / results : 0;
      const roi = results > 0 ? (results * 100) / spent : 0; // 100 is the assumed value per conversion
      
      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        budget: parseFloat(campaign.budget_remaining || '0') + spent,
        spent,
        results,
        cpa,
        roi,
        objective: campaign.objective,
        ctr,
        impressions,
        reach,
        clicks,
        cpc,
        cpm
      };
    });
    
    // Calculate aggregate insights from the processed campaigns
    const totalSpent = accountLevelSpend > 0 ? accountLevelSpend : 
      processedCampaigns.reduce((sum, campaign) => sum + campaign.spent, 0);
      
    const totalResults = accountLevelResults > 0 ? accountLevelResults :
      processedCampaigns.reduce((sum, campaign) => sum + campaign.results, 0);
      
    const averageCPA = totalResults > 0 ? totalSpent / totalResults : 0;
    const averageROI = totalSpent > 0 ? (totalResults * 100) / totalSpent : 0;
    
    // Fetch daily data for performance chart
    const dailyInsightsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/insights?fields=spend,actions,impressions,clicks&time_increment=1&time_range={"since":"${since}","until":"${until}"}&access_token=${META_API_TOKEN}`,
      { method: 'GET' }
    );
    
    const dailyInsightsData = await dailyInsightsResponse.json();
    let dailyPerformance: any[] = [];
    
    if (!dailyInsightsData.error && dailyInsightsData.data && dailyInsightsData.data.length > 0) {
      dailyPerformance = dailyInsightsData.data.map((day: any) => {
        // Extract purchase or lead actions
        let dayResults = 0;
        
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
        
        const daySpend = parseFloat(day.spend || '0');
        const dayRevenue = dayResults * 100; // Assuming $100 value per result
        const dayRoas = daySpend > 0 ? dayRevenue / daySpend : 0;
        
        return {
          date: day.date_start,
          spend: daySpend,
          revenue: dayRevenue,
          roas: dayRoas,
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
        averageCPA,
        averageROI
      },
      dailyData: dailyPerformance
    };

    // Return the campaign data
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
