
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

    // Get Meta app credentials from environment variables
    const META_APP_ID = Deno.env.get('META_APP_ID');
    const META_APP_SECRET = Deno.env.get('META_APP_SECRET');

    if (!META_APP_ID || !META_APP_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Meta API credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a random state for security
    const state = crypto.randomUUID();

    // Store the state in the database to verify later
    await supabaseClient
      .from('meta_connection_states')
      .insert({
        user_id: user.id,
        state,
        created_at: new Date()
      });

    // Build the Meta OAuth URL with the correct redirect URI
    // Use the current origin or fallback to the main domain
    const origin = req.headers.get('origin') || 'https://6f692784-112f-4f32-8ef4-d994ce7daea2.lovableproject.com';
    const redirectUri = `${origin}/meta-callback`;
    
    console.log('Using redirect URI:', redirectUri);
    
    // Request permissions for ads_management, ads_read, business_management
    const scopes = ['ads_management', 'ads_read', 'business_management'].join(',');
    
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}` + 
      `&scope=${encodeURIComponent(scopes)}` +
      `&response_type=code`;

    console.log('Generated auth URL:', authUrl);

    return new Response(
      JSON.stringify({ authUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in init-meta-connection function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
