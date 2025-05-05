
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
    const requestBody = await req.json();
    const { dataType, dataPoints, query } = requestBody;

    console.log(`Received analysis request for ${dataType} with ${dataPoints?.length || 0} data points`);
    console.log(`User query: ${query}`);
    
    if (!dataPoints || dataPoints.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No data provided',
          message: `No ${dataType || 'data'} available for analysis` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get OpenAI API key from Supabase secrets
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the system message based on data type
    let systemPrompt = `You are an expert marketing analytics AI assistant that specializes in analyzing Meta/Facebook ads data. `;
    
    if (dataType === 'campaigns') {
      systemPrompt += `You are analyzing campaign performance data to identify patterns, opportunities, and issues. 
      Please provide clear, actionable insights that marketers can immediately apply to optimize their campaigns.
      Format your response with clear sections, bullet points where appropriate, and highlight key metrics.`;
    } else if (dataType === 'creatives') {
      systemPrompt += `You are analyzing ad creative performance to identify which creative elements, themes, and approaches 
      are performing best. Focus on identifying patterns across successful creatives and suggest specific improvements.
      Format your response with clear sections, bullet points where appropriate, and highlight key creative elements.`;
    } else {
      systemPrompt += `Analyze the provided marketing data and identify key insights, patterns, and recommendations.
      Format your response with clear sections, bullet points where appropriate, and highlight key metrics.`;
    }

    // Prepare simplified data for the AI if needed
    let formattedData = dataPoints;
    if (dataType === 'campaigns' && dataPoints.length > 10) {
      // If there are too many campaigns, simplify the data to focus on the most important fields
      formattedData = dataPoints.map(campaign => ({
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective,
        spent: campaign.spent,
        results: campaign.results,
        revenue: campaign.revenue,
        roi: campaign.roi,
        ctr: campaign.ctr,
        cpc: campaign.cpc,
        cpa: campaign.cpa
      }));
    }

    console.log("Calling OpenAI API with model gpt-4o-mini...");

    // Call the OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Here is the data to analyze: ${JSON.stringify(formattedData)}\n\nUser query: ${query}` }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return new Response(
        JSON.stringify({ error: 'Error calling OpenAI API', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const insights = data.choices[0].message.content;

    console.log("Analysis completed successfully");

    // Return the insights
    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-with-ai function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
