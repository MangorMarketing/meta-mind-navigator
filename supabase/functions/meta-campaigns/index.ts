
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
      return new Response(
        JSON.stringify({ 
          error: 'No Meta connection found',
          message: 'Please connect your Meta account first' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Meta API to fetch real campaign data
    const META_API_TOKEN = Deno.env.get('META_API_TOKEN');
    
    // If we don't have a specific ad account ID yet, we can query for the user's ad accounts
    let adAccountId = metaConnection.ad_account_id;
    
    if (!adAccountId) {
      // Get list of ad accounts the user has access to
      const adAccountsResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/adaccounts?fields=name,account_id&access_token=${META_API_TOKEN}`,
        { method: 'GET' }
      );
      
      const adAccountsData = await adAccountsResponse.json();
      
      if (adAccountsData.error) {
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
        
        // Update the user's meta_connection with this ad account ID
        await supabaseClient
          .from('meta_connections')
          .update({ ad_account_id: adAccountId })
          .eq('id', metaConnection.id);
      } else {
        return new Response(
          JSON.stringify({ 
            error: 'No ad accounts found', 
            message: 'Your Meta account does not have access to any ad accounts' 
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch campaigns for the ad account
    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/campaigns?fields=name,status,objective,budget_remaining,spend,insights{ctr,impressions,reach,clicks,cpc,cpm,cost_per_conversion,conversions}&access_token=${META_API_TOKEN}`,
      { method: 'GET' }
    );
    
    const campaignsData = await campaignsResponse.json();
    
    if (campaignsData.error) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch Meta campaigns', 
          details: campaignsData.error 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
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
