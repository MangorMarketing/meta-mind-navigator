
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

    // Get request body
    let requestData = {};
    if (req.method === 'POST') {
      requestData = await req.json();
    }

    // This is where we would use the OpenAI API to generate insights
    // For now, we'll return mock insights data
    const mockInsights = {
      insights: [
        {
          id: 'insight-1',
          category: 'opportunity',
          title: 'Increase budget for high-performing campaigns',
          description: 'Your "Summer Collection" campaign is performing 35% better than average. Consider increasing its budget to maximize ROI.',
          impact: 'high',
          status: 'new'
        },
        {
          id: 'insight-2',
          category: 'issue',
          title: 'High CPA in mobile placements',
          description: 'Mobile placements are showing 28% higher CPA than desktop. Consider optimizing mobile creative or adjusting bids for better performance.',
          impact: 'medium',
          status: 'new'
        },
        {
          id: 'insight-3',
          category: 'opportunity',
          title: 'Audience expansion opportunity',
          description: 'Similar audiences to your current target are showing strong engagement. Consider creating a lookalike campaign to reach new potential customers.',
          impact: 'medium',
          status: 'implemented'
        }
      ],
      timestamp: new Date().toISOString()
    };

    // Return the AI insights
    return new Response(
      JSON.stringify(mockInsights),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
