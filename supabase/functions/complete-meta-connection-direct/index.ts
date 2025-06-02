
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
    const { accessToken, userID, expiresIn } = await req.json();
    
    if (!accessToken || !userID) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Received direct Meta connection:', { userID, expiresIn: !!expiresIn });

    // Verify the access token by making a test request to Facebook's API
    const verifyResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`,
      { method: 'GET' }
    );

    const verifyData = await verifyResponse.json();

    if (verifyData.error) {
      console.error('Error verifying access token:', verifyData.error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid access token', 
          details: verifyData.error 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Access token verified for user:', verifyData.id);

    // Calculate when the token will expire (default to 2 hours if not provided)
    const now = new Date();
    const tokenExpiresIn = expiresIn || 7200; // Default 2 hours
    const expiresAt = new Date(now.getTime() + tokenExpiresIn * 1000);

    // Try to get user's existing Meta connection
    const { data: existingConnection, error: connectionError } = await supabaseClient
      .from('meta_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Store or update the Meta connection
    if (existingConnection) {
      console.log('Updating existing Meta connection');
      await supabaseClient
        .from('meta_connections')
        .update({
          access_token: accessToken,
          business_id: verifyData.id,
          token_expires_at: expiresAt,
        })
        .eq('id', existingConnection.id);
    } else {
      console.log('Creating new Meta connection');
      await supabaseClient
        .from('meta_connections')
        .insert({
          user_id: user.id,
          access_token: accessToken,
          business_id: verifyData.id,
          token_expires_at: expiresAt,
        });
    }

    // Update user's profile to mark Meta as connected
    await supabaseClient
      .from('profiles')
      .update({ meta_connected: true })
      .eq('id', user.id);

    console.log('Meta connection completed successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in complete-meta-connection-direct function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
