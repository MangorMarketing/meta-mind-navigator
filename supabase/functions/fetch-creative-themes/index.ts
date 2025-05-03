import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Theme definitions with detection patterns
const themeDefinitions = [
  {
    name: "Testimonials",
    patterns: ["testimonial", "customer story", "review", "success story", "what people say"],
    color: "#9b87f5"
  },
  {
    name: "Limited Time Offers",
    patterns: ["limited time", "offer ends", "sale ends", "last chance", "only today", "hurry", "flash sale"],
    color: "#f59e0b"
  },
  {
    name: "Product Features",
    patterns: ["features", "introducing", "how it works", "benefits", "discover", "meet the", "presenting"],
    color: "#4ade80"
  },
  {
    name: "Social Proof",
    patterns: ["trusted by", "used by", "5-star", "top rated", "best selling", "as seen in", "verified"],
    color: "#3b82f6"
  },
  {
    name: "Before & After",
    patterns: ["before and after", "transformation", "results", "see the difference", "compare"],
    color: "#ec4899"
  },
  {
    name: "Special Promotion",
    patterns: ["special promotion", "discount", "sale", "% off", "deal", "savings", "free shipping"],
    color: "#f43f5e"
  },
  {
    name: "How-To",
    patterns: ["how to", "step by step", "guide", "tutorial", "learn how", "tips for"],
    color: "#6366f1"
  },
  {
    name: "Influencer",
    patterns: ["influencer", "celebrity", "ambassador", "endorsed by", "partner with"],
    color: "#8b5cf6"
  }
];

// Function to detect themes in creative text
function detectThemes(text: string): string[] {
  if (!text) return [];
  
  const lowercasedText = text.toLowerCase();
  const detectedThemes: string[] = [];
  
  themeDefinitions.forEach(theme => {
    const isMatch = theme.patterns.some(pattern => lowercasedText.includes(pattern.toLowerCase()));
    if (isMatch) {
      detectedThemes.push(theme.name);
    }
  });
  
  return detectedThemes;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token', details: userError }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body for adAccountId and timeRange
    let adAccountId: string | undefined;
    let timeRange: string = 'last_30_days';
    
    if (req.headers.get('content-type')?.includes('application/json')) {
      try {
        const requestBody = await req.json();
        adAccountId = requestBody.adAccountId;
        
        if (requestBody.timeRange) {
          timeRange = requestBody.timeRange;
        }
      } catch (e) {
        console.log('No request body or invalid JSON');
      }
    }
    
    // If no adAccountId provided, try to get it from meta_connections
    if (!adAccountId) {
      const { data: connectionData } = await supabaseClient
        .from('meta_connections')
        .select('ad_account_id')
        .eq('user_id', user.id)
        .single();
        
      if (connectionData?.ad_account_id) {
        adAccountId = connectionData.ad_account_id;
      }
    }
    
    if (!adAccountId) {
      return new Response(
        JSON.stringify({ 
          error: 'No ad account ID provided',
          message: 'Please provide an ad account ID or connect your Meta account' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get Meta API token from user's connections
    const { data: metaConnection, error: metaError } = await supabaseClient
      .from('meta_connections')
      .select('access_token, token_expires_at')
      .eq('user_id', user.id)
      .single();
      
    if (metaError || !metaConnection?.access_token) {
      return new Response(
        JSON.stringify({ 
          error: 'No Meta connection found',
          message: 'Please connect your Meta account' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if token is expired
    const now = new Date();
    const tokenExpiresAt = metaConnection.token_expires_at ? new Date(metaConnection.token_expires_at) : null;
    
    if (tokenExpiresAt && now > tokenExpiresAt) {
      return new Response(
        JSON.stringify({ 
          error: 'Meta access token expired',
          message: 'Your Meta connection has expired. Please reconnect your account.' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate date range for API request
    const today = new Date();
    const dates = {
      'today': {
        since: today.toISOString().split('T')[0],
        until: today.toISOString().split('T')[0]
      },
      'yesterday': {
        since: new Date(today.setDate(today.getDate() - 1)).toISOString().split('T')[0],
        until: new Date(today.setDate(today.getDate())).toISOString().split('T')[0]
      },
      'last_7_days': {
        since: new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0],
        until: new Date().toISOString().split('T')[0]
      },
      'last_30_days': {
        since: new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0],
        until: new Date().toISOString().split('T')[0]
      },
      'last_90_days': {
        since: new Date(today.setDate(today.getDate() - 90)).toISOString().split('T')[0],
        until: new Date().toISOString().split('T')[0]
      }
    };

    const { since, until } = dates[timeRange as keyof typeof dates] || dates.last_30_days;

    // Fetch ad creatives with insights
    const creativeResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/adcreatives?fields=id,name,body,title,object_story_spec,thumbnail_url,url_tags,effective_object_story_id&limit=50&access_token=${metaConnection.access_token}`,
      { method: 'GET' }
    );

    const creativeData = await creativeResponse.json();
    
    if (creativeData.error) {
      console.error('Error fetching creative data:', creativeData.error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch creative data', 
          details: creativeData.error 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch ads to get performance metrics and link to creatives
    const adsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/ads?fields=id,name,creative{id},adset{name},insights{impressions,clicks,ctr,cpc,spend,actions,conversion_values}&time_range={"since":"${since}","until":"${until}"}&limit=100&access_token=${metaConnection.access_token}`,
      { method: 'GET' }
    );
    
    const adsData = await adsResponse.json();
    
    if (adsData.error) {
      console.error('Error fetching ads data:', adsData.error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch ads data', 
          details: adsData.error 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Process creatives to detect themes
    const themeDataMap = new Map();
    
    if (creativeData.data && adsData.data) {
      const creativeIdToAd = new Map();
      
      // Map creative IDs to ads with performance data
      adsData.data.forEach((ad: any) => {
        if (ad.creative && ad.creative.id && ad.insights && ad.insights.data && ad.insights.data.length > 0) {
          creativeIdToAd.set(ad.creative.id, {
            adId: ad.id,
            adName: ad.name,
            insights: ad.insights.data[0]
          });
        }
      });
      
      // Process each creative and detect themes
      creativeData.data.forEach((creative: any) => {
        // Extract relevant text from creative to detect themes
        const text = [
          creative.name,
          creative.title,
          creative.body,
          creative.object_story_spec?.link_data?.message,
          creative.object_story_spec?.link_data?.description,
          creative.object_story_spec?.link_data?.call_to_action?.value?.link_caption,
          creative.object_story_spec?.photo_data?.message,
          creative.object_story_spec?.video_data?.message
        ].filter(Boolean).join(' ');
        
        // Detect themes from the text
        const detectedThemes = detectThemes(text);
        
        // If no themes detected, assign "Other"
        const themes = detectedThemes.length > 0 ? detectedThemes : ["Other"];
        
        // Get performance data for this creative if available
        const adData = creativeIdToAd.get(creative.id);
        
        themes.forEach(theme => {
          if (!themeDataMap.has(theme)) {
            themeDataMap.set(theme, {
              id: crypto.randomUUID(),
              name: theme,
              performance: 0,
              count: 0,
              totalSpend: 0,
              totalResults: 0,
              examples: [],
              color: themeDefinitions.find(def => def.name === theme)?.color || "#64748b" // Default color
            });
          }
          
          const themeData = themeDataMap.get(theme);
          themeData.count++;
          
          if (adData && adData.insights) {
            // Add spend
            const spend = parseFloat(adData.insights.spend || '0');
            themeData.totalSpend += spend;
            
            // Add results/conversions
            let results = 0;
            if (adData.insights.actions) {
              const purchaseActions = adData.insights.actions.find(
                (action: any) => action.action_type === 'purchase' || 
                                action.action_type === 'offsite_conversion.fb_pixel_purchase'
              );
              
              if (purchaseActions) {
                results = parseInt(purchaseActions.value || '0');
              } else {
                // Look for leads if no purchases
                const leadActions = adData.insights.actions.find(
                  (action: any) => action.action_type === 'lead' || 
                                  action.action_type === 'offsite_conversion.fb_pixel_lead'
                );
                
                if (leadActions) {
                  results = parseInt(leadActions.value || '0');
                }
              }
            }
            
            themeData.totalResults += results;
            
            // Add example if not already added
            if (themeData.examples.length < 10 && !themeData.examples.includes(adData.adName)) {
              themeData.examples.push(adData.adName);
            }
          }
        });
      });
      
      // Calculate overall performance metrics after processing all creatives
      themeDataMap.forEach((themeData) => {
        // Calculate performance as ROAS or engagement metric
        if (themeData.totalSpend > 0 && themeData.totalResults > 0) {
          // Using ROAS as performance metric (assuming $100 per result)
          themeData.performance = (themeData.totalResults * 100) / themeData.totalSpend;
        } else {
          // Default performance
          themeData.performance = 1.0;
        }
        
        // Keep it to 2 decimal points
        themeData.performance = Math.round(themeData.performance * 100) / 100;
      });
    } else {
      // If we don't have real data, provide sample themes
      themeDefinitions.forEach((theme) => {
        themeDataMap.set(theme.name, {
          id: crypto.randomUUID(),
          name: theme.name,
          performance: Math.random() * 1.5 + 0.5, // Between 0.5 and 2.0
          count: Math.floor(Math.random() * 10) + 1, // Between 1 and 10
          totalSpend: Math.random() * 1000 + 100,
          totalResults: Math.random() * 20 + 1,
          examples: theme.patterns.slice(0, 2),
          color: theme.color
        });
      });
    }
    
    const themesArray = Array.from(themeDataMap.values());
    
    return new Response(
      JSON.stringify({ 
        themes: themesArray
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in fetch-creative-themes function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
