
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    // If we don't have a specific ad account ID yet, we can query for the user's ad accounts
    let adAccountId = metaConnection.ad_account_id;
    
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
        adAccountId = adAccountsData.data[0].id;
        console.log('Found ad account ID:', adAccountId);
        
        // Update the user's meta_connection with this ad account ID
        await supabaseClient
          .from('meta_connections')
          .update({ ad_account_id: adAccountId })
          .eq('id', metaConnection.id);
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
    
    // Fetch campaigns for the ad account
    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/campaigns?fields=name,status,objective,budget_remaining,spend,insights{ctr,impressions,reach,clicks,cpc,cpm,cost_per_conversion,conversions}&access_token=${META_API_TOKEN}`,
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
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Transform the campaign data to match our expected format
    const processedCampaigns = campaignsData.data.map(campaign => {
      const insights = campaign.insights?.data?.[0] || {};
      const conversionsValue = insights.conversions || 0;
      let conversions = 0;
      
      // Handle different conversion formats from the API
      if (typeof conversionsValue === 'object') {
        // If it's an object with actions, sum them up
        if (Array.isArray(conversionsValue.actions)) {
          conversions = conversionsValue.actions.reduce((sum, action) => sum + (parseInt(action.value) || 0), 0);
        } else {
          // If it's some other format, try to get a number or default to 0
          conversions = parseInt(conversionsValue.toString()) || 0;
        }
      } else {
        conversions = parseInt(conversionsValue.toString()) || 0;
      }
      
      const spent = parseFloat(campaign.spend || '0');
      const results = conversions;
      
      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        budget: parseFloat(campaign.budget_remaining || '0') + spent, // Approximate total budget
        spent: spent,
        results: results,
        cpa: results > 0 ? spent / results : 0,
        roi: results > 0 ? (results * 100) / spent : 0, // Assuming $100 value per conversion
        objective: campaign.objective,
        ctr: parseFloat(insights.ctr || '0'),
        impressions: parseInt(insights.impressions || '0'),
        reach: parseInt(insights.reach || '0'),
        clicks: parseInt(insights.clicks || '0'),
        cpc: parseFloat(insights.cpc || '0'),
        cpm: parseFloat(insights.cpm || '0')
      };
    });
    
    // Calculate aggregate insights
    const totalSpent = processedCampaigns.reduce((sum, campaign) => sum + campaign.spent, 0);
    const totalResults = processedCampaigns.reduce((sum, campaign) => sum + campaign.results, 0);
    const averageCPA = totalResults > 0 ? totalSpent / totalResults : 0;
    const averageROI = totalSpent > 0 ? (totalResults * 100) / totalSpent : 0;
    
    const responseData = {
      campaigns: processedCampaigns,
      insights: {
        totalSpent,
        totalResults,
        averageCPA,
        averageROI
      }
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
