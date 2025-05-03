
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

// Parse date with fallback
function parseDate(dateString: string | undefined): string {
  if (!dateString) return new Date().toISOString();
  try {
    return new Date(dateString).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

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
    let since: string, until: string;
    
    const dateRanges: Record<string, { since: string, until: string }> = {
      'today': {
        since: today.toISOString().split('T')[0],
        until: today.toISOString().split('T')[0]
      },
      'yesterday': {
        since: new Date(today.getTime() - 86400000).toISOString().split('T')[0],
        until: new Date(today.getTime() - 86400000).toISOString().split('T')[0]
      },
      'last_7_days': {
        since: new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0],
        until: today.toISOString().split('T')[0]
      },
      'last_30_days': {
        since: new Date(today.getTime() - 30 * 86400000).toISOString().split('T')[0],
        until: today.toISOString().split('T')[0]
      },
      'last_90_days': {
        since: new Date(today.getTime() - 90 * 86400000).toISOString().split('T')[0],
        until: today.toISOString().split('T')[0]
      }
    };
    
    // Get the date range based on the selected timeRange
    if (dateRanges[timeRange]) {
      since = dateRanges[timeRange].since;
      until = dateRanges[timeRange].until;
    } else {
      // Default to last 30 days
      since = dateRanges['last_30_days'].since;
      until = dateRanges['last_30_days'].until;
    }

    console.log(`Fetching creatives for ad account ${adAccountId} from ${since} to ${until}`);

    // Fetch ad creatives with insights
    const creativeResponse = await fetch(
      `https://graph.facebook.com/v18.0/${adAccountId}/adcreatives?fields=id,name,body,title,object_story_spec,thumbnail_url,effective_object_story_id&limit=50&access_token=${metaConnection.access_token}`,
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
      `https://graph.facebook.com/v18.0/${adAccountId}/ads?fields=id,name,creative{id},adset{name},status,effective_status,insights{impressions,clicks,ctr,cpc,spend,actions,conversion_values}&time_range={"since":"${since}","until":"${until}"}&limit=100&access_token=${metaConnection.access_token}`,
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
    
    // Process creatives and link with performance data
    const processedCreatives = [];
    
    if (creativeData.data && adsData.data) {
      // Map ads by creative ID for quick lookup
      const adsByCreativeId = new Map();
      
      adsData.data.forEach((ad: any) => {
        if (ad.creative && ad.creative.id) {
          if (!adsByCreativeId.has(ad.creative.id)) {
            adsByCreativeId.set(ad.creative.id, []);
          }
          adsByCreativeId.get(ad.creative.id).push(ad);
        }
      });
      
      // Process each creative with performance data from linked ads
      for (const creative of creativeData.data) {
        const linkedAds = adsByCreativeId.get(creative.id) || [];
        
        if (linkedAds.length === 0) continue; // Skip creatives without linked ads
        
        // Extract text content for theme detection
        const text = [
          creative.name,
          creative.title,
          creative.body,
          creative.object_story_spec?.link_data?.message,
          creative.object_story_spec?.link_data?.description,
          creative.object_story_spec?.photo_data?.message,
          creative.object_story_spec?.video_data?.message
        ].filter(Boolean).join(' ');
        
        // Detect themes from the creative content
        const detectedThemes = detectThemes(text);
        const themes = detectedThemes.length > 0 ? detectedThemes : ["Other"];
        
        // Aggregate performance metrics across all ads using this creative
        let totalImpressions = 0;
        let totalClicks = 0;
        let totalSpend = 0;
        let totalConversions = 0;
        let totalRevenue = 0;
        
        // Determine creative type and URL
        const isVideo = !!creative.object_story_spec?.video_data;
        let thumbnailUrl = creative.thumbnail_url || "";
        let url = "";
        
        // Get creative URL and thumbnail
        if (creative.object_story_spec) {
          if (isVideo) {
            url = creative.object_story_spec?.video_data?.video_url || "";
            thumbnailUrl = creative.object_story_spec?.video_data?.thumbnail_url || thumbnailUrl;
          } else if (creative.object_story_spec?.link_data) {
            url = creative.object_story_spec.link_data.link || "";
            thumbnailUrl = creative.object_story_spec.link_data.picture || thumbnailUrl;
          } else if (creative.object_story_spec?.photo_data) {
            url = creative.object_story_spec.photo_data.url || "";
            thumbnailUrl = creative.object_story_spec.photo_data.url || thumbnailUrl;
          }
        }
        
        // If no thumbnail found, use a placeholder
        if (!thumbnailUrl) {
          thumbnailUrl = "https://source.unsplash.com/random/800x600?ad";
        }
        
        // Determine status based on linked ads
        const allStatuses = linkedAds.map((ad: any) => ad.effective_status || ad.status);
        let status: "active" | "paused" | "archived" = "archived";
        
        if (allStatuses.some(s => s === "ACTIVE")) {
          status = "active";
        } else if (allStatuses.some(s => s === "PAUSED")) {
          status = "paused";
        }
        
        // Collect performance data from all ads using this creative
        linkedAds.forEach((ad: any) => {
          if (ad.insights && ad.insights.data && ad.insights.data.length > 0) {
            const insight = ad.insights.data[0];
            
            totalImpressions += parseInt(insight.impressions || '0');
            totalClicks += parseInt(insight.clicks || '0');
            totalSpend += parseFloat(insight.spend || '0');
            
            // Parse conversions from actions
            if (insight.actions) {
              const purchaseActions = insight.actions.find(
                (action: any) => action.action_type === 'purchase' || 
                                action.action_type === 'offsite_conversion.fb_pixel_purchase'
              );
              
              if (purchaseActions) {
                totalConversions += parseInt(purchaseActions.value || '0');
              } else {
                // Look for leads if no purchases
                const leadActions = insight.actions.find(
                  (action: any) => action.action_type === 'lead' || 
                                  action.action_type === 'offsite_conversion.fb_pixel_lead'
                );
                
                if (leadActions) {
                  totalConversions += parseInt(leadActions.value || '0');
                }
              }
            }
            
            // Parse revenue from conversion_values
            if (insight.conversion_values) {
              const conversionValue = insight.conversion_values.find(
                (value: any) => value.action_type === 'offsite_conversion.fb_pixel_purchase'
              );
              
              if (conversionValue) {
                totalRevenue += parseFloat(conversionValue.value || '0');
              }
            }
          }
        });
        
        // Calculate performance metrics
        const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
        const revenue = totalRevenue > 0 ? totalRevenue : totalConversions * 100; // Assume $100 per conversion if no revenue data
        const roas = totalSpend > 0 ? revenue / totalSpend : 0;
        const performance = roas > 0 ? roas : (ctr > 0.05 ? ctr * 20 : 0.8); // Use ROAS or CTR-based score
        
        // Determine date range for the creative from ads
        let startDate = new Date();
        let endDate = new Date();
        
        // Extract min start date and max end date
        linkedAds.forEach((ad: any) => {
          const adsetStartTime = ad.adset?.start_time;
          const adsetEndTime = ad.adset?.end_time;
          
          if (adsetStartTime) {
            const adStartDate = new Date(adsetStartTime);
            if (adStartDate < startDate) {
              startDate = adStartDate;
            }
          }
          
          if (adsetEndTime) {
            const adEndDate = new Date(adsetEndTime);
            if (adEndDate > endDate) {
              endDate = adEndDate;
            }
          }
        });
        
        // Add the processed creative
        processedCreatives.push({
          id: creative.id,
          name: creative.name,
          type: isVideo ? "video" : "image",
          url: url,
          thumbnailUrl: thumbnailUrl,
          performance: Math.round(performance * 100) / 100,
          impressions: totalImpressions,
          clicks: totalClicks,
          ctr: ctr,
          conversions: totalConversions,
          spend: totalSpend,
          revenue: revenue,
          roas: roas,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          themes: themes,
          status: status
        });
      }
    }
    
    return new Response(
      JSON.stringify({ creatives: processedCreatives }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-meta-creatives function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
