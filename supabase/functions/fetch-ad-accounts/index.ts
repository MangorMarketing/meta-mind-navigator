
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
      .select('access_token')
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

    // Format ad accounts for frontend
    const formattedAdAccounts = adAccountsData.data?.map((account: any) => ({
      id: account.id,
      name: account.name,
      accountId: account.account_id
    })) || [];
    
    // Return the ad accounts
    return new Response(
      JSON.stringify({ adAccounts: formattedAdAccounts }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-ad-accounts function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
