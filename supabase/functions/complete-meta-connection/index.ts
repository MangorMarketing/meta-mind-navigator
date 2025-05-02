
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

    // Parse request body
    const { code, state, redirectUri } = await req.json();
    
    if (!code || !state || !redirectUri) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify state parameter against stored state
    const { data: stateData, error: stateError } = await supabaseClient
      .from('meta_connection_states')
      .select('*')
      .eq('user_id', user.id)
      .eq('state', state)
      .single();

    if (stateError || !stateData) {
      return new Response(
        JSON.stringify({ error: 'Invalid state parameter', details: stateError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete the used state
    await supabaseClient
      .from('meta_connection_states')
      .delete()
      .eq('id', stateData.id);

    // Get Meta app credentials
    const META_APP_ID = Deno.env.get('META_APP_ID');
    const META_APP_SECRET = Deno.env.get('META_APP_SECRET');

    if (!META_APP_ID || !META_APP_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Meta API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Exchange the authorization code for an access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${META_APP_SECRET}` +
      `&code=${code}`,
      { method: 'GET' }
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Error exchanging code for token:', tokenData.error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to exchange code for access token', 
          details: tokenData.error 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in;

    // Get the Facebook user ID for this token
    const userDataResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`,
      { method: 'GET' }
    );

    const userData = await userDataResponse.json();

    if (userData.error) {
      console.error('Error getting user data:', userData.error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to get Facebook user data', 
          details: userData.error 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate when the token will expire
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresIn * 1000);

    // Try to get user's existing Meta connection
    const { data: existingConnection, error: connectionError } = await supabaseClient
      .from('meta_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Store or update the Meta connection
    if (existingConnection) {
      // Update existing connection
      await supabaseClient
        .from('meta_connections')
        .update({
          access_token: accessToken,
          business_id: userData.id,
          token_expires_at: expiresAt,
        })
        .eq('id', existingConnection.id);
    } else {
      // Create new connection
      await supabaseClient
        .from('meta_connections')
        .insert({
          user_id: user.id,
          access_token: accessToken,
          business_id: userData.id,
          token_expires_at: expiresAt,
        });
    }

    // Update user's profile to mark Meta as connected
    await supabaseClient
      .from('profiles')
      .update({ meta_connected: true })
      .eq('id', user.id);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in complete-meta-connection function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
