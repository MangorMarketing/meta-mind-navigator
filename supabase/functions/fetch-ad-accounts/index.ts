
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache TTL in seconds (10 minutes)
const CACHE_TTL = 600;

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

    // Check cache for ad accounts data
    const { data: cachedData, error: cacheError } = await supabaseClient
      .from('ad_accounts_cache')
      .select('data, updated_at')
      .eq('user_id', user.id)
      .single();
    
    // If we have cached data and it's not expired, return it
    if (cachedData && !cacheError) {
      const updatedAt = new Date(cachedData.updated_at);
      const now = new Date();
      const cacheAgeInSeconds = (now.getTime() - updatedAt.getTime()) / 1000;
      
      if (cacheAgeInSeconds < CACHE_TTL) {
        console.log('Returning cached ad accounts data');
        return new Response(
          JSON.stringify(cachedData.data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Cache expired, fetching fresh data');
    } else {
      console.log('No cache found or cache error, fetching fresh data');
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
    
    // Get list of ad accounts the user has access to with retry logic
    let adAccountsData;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    while (retryCount < maxRetries) {
      try {
        const adAccountsResponse = await fetch(
          `https://graph.facebook.com/v18.0/me/adaccounts?fields=name,account_id&access_token=${META_API_TOKEN}`,
          { method: 'GET' }
        );
        
        adAccountsData = await adAccountsResponse.json();
        
        if (!adAccountsResponse.ok || adAccountsData.error) {
          // If we hit rate limit, wait and retry
          if (adAccountsData.error?.code === 80004 && retryCount < maxRetries - 1) {
            console.log(`Rate limit hit, retrying after ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
            retryCount++;
            continue;
          }
          
          throw new Error(adAccountsData.error?.message || 'Failed to fetch Meta ad accounts');
        }
        
        // If successful, break out of the retry loop
        break;
      } catch (error) {
        if (retryCount < maxRetries - 1) {
          console.log(`Error in fetch attempt ${retryCount + 1}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
          retryCount++;
        } else {
          console.error('Error fetching Meta ad accounts:', error);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to fetch Meta ad accounts', 
              details: error.message,
              message: 'We encountered an issue with the Meta API. This could be due to rate limiting or an API outage. Please try again in a few minutes.'
            }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Format ad accounts for frontend
    const formattedAdAccounts = adAccountsData.data?.map((account: any) => ({
      id: account.id,
      name: account.name,
      accountId: account.account_id
    })) || [];
    
    // Cache the ad accounts data
    try {
      const responseData = { adAccounts: formattedAdAccounts };
      
      // Use upsert to create or update cache
      await supabaseClient
        .from('ad_accounts_cache')
        .upsert(
          { 
            user_id: user.id, 
            data: responseData, 
            updated_at: new Date().toISOString() 
          },
          { onConflict: 'user_id' }
        );
        
      // Return the ad accounts
      return new Response(
        JSON.stringify(responseData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (cacheError) {
      console.error('Error caching ad accounts:', cacheError);
      
      // Even if caching fails, return the ad accounts
      return new Response(
        JSON.stringify({ adAccounts: formattedAdAccounts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in fetch-ad-accounts function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        message: 'An unexpected error occurred. Please try again or contact support.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
