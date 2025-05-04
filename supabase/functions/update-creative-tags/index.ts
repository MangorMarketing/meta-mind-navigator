
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

    // Verify and decode the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token', details: userError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    if (!req.headers.get('content-type')?.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: 'Request must be JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { creativeId, tags, adAccountId } = await req.json();
    
    if (!creativeId) {
      return new Response(
        JSON.stringify({ error: 'Creative ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Ensure the user has access to the ad account
    if (adAccountId) {
      const { data: metaConnection, error: metaError } = await supabaseClient
        .from('meta_connections')
        .select('ad_account_id')
        .eq('user_id', user.id)
        .single();
        
      if (metaError || !metaConnection || metaConnection.ad_account_id !== adAccountId) {
        return new Response(
          JSON.stringify({ 
            error: 'User does not have access to this ad account',
            message: 'You do not have permission to update tags for this creative' 
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // Update or insert the tags
    const { data, error } = await supabaseClient
      .from('creative_tags')
      .upsert(
        {
          creative_id: creativeId,
          user_id: user.id,
          ad_account_id: adAccountId,
          tags: Array.isArray(tags) ? tags : [],
          updated_at: new Date().toISOString()
        },
        { onConflict: 'creative_id, user_id' }
      );
      
    if (error) {
      console.error('Error updating creative tags:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update creative tags', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch the updated record
    const { data: updatedData, error: fetchError } = await supabaseClient
      .from('creative_tags')
      .select('*')
      .eq('creative_id', creativeId)
      .eq('user_id', user.id)
      .single();
      
    if (fetchError) {
      console.error('Error fetching updated creative tags:', fetchError);
    }
    
    return new Response(
      JSON.stringify({
        message: 'Creative tags updated successfully',
        data: updatedData || { creative_id: creativeId, tags }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-creative-tags function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
