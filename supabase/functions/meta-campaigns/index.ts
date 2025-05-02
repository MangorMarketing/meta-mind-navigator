
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
      
      // If no Meta connection exists, try to create one with the provided API token
      const META_API_TOKEN = Deno.env.get('META_API_TOKEN');
      const META_APP_ID = Deno.env.get('META_APP_ID');
      
      if (!META_API_TOKEN) {
        return new Response(
          JSON.stringify({ 
            error: 'No Meta API token configured',
            message: 'Please configure a Meta API token in the project settings' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Try to get user account information from Meta API
      const userAccountResponse = await fetch(
        `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${META_API_TOKEN}`,
        { method: 'GET' }
      );
      
      const userAccountData = await userAccountResponse.json();
      
      if (userAccountData.error) {
        console.error('Error fetching Meta user account:', userAccountData.error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to fetch Meta user account', 
            details: userAccountData.error 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Create a new Meta connection for the user
      const { data: newConnection, error: insertError } = await supabaseClient
        .from('meta_connections')
        .insert({
          user_id: user.id,
          access_token: META_API_TOKEN,
          business_id: userAccountData.id
        })
        .select('*')
        .single();
      
      if (insertError) {
        console.error('Error creating Meta connection:', insertError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create Meta connection', 
            details: insertError 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Update user's meta_connected status
      await supabaseClient
        .from('profiles')
        .update({ meta_connected: true })
        .eq('id', user.id);
      
      // Use the newly created connection
      metaConnection = newConnection;
    }

    // Use Meta API to fetch real campaign data
    const META_API_TOKEN = metaConnection.access_token || Deno.env.get('META_API_TOKEN');
    
    if (!META_API_TOKEN) {
      return new Response(
        JSON.stringify({ 
          error: 'No Meta API token available',
          message: 'Please connect your Meta account or configure a Meta API token' 
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
    
    // Transform the campaign data to match our expected format
    const processedCampaigns = campaignsData.data.map(campaign => {
      const insights = campaign.insights?.data?.[0] || {};
      const conversions = insights.conversions || 0;
      const spent = parseFloat(campaign.spend || '0');
      const results = parseInt(conversions.toString() || '0');
      
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
        ctr: insights.ctr || 0,
        impressions: insights.impressions || 0,
        reach: insights.reach || 0,
        clicks: insights.clicks || 0,
        cpc: insights.cpc || 0,
        cpm: insights.cpm || 0
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
