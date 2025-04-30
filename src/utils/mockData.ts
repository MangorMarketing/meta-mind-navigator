
// Mock data for Meta Ads Platform

// Campaign performance data
export interface CampaignPerformance {
  id: string;
  name: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  roas: number;
  mer: number;
  startDate: string;
  endDate: string;
}

// Daily performance data for charts
export interface DailyPerformance {
  date: string;
  spend: number;
  revenue: number;
  roas: number;
  impressions: number;
  clicks: number;
}

// Creative theme data
export interface CreativeTheme {
  id: string;
  name: string;
  count: number;
  performance: number; // relative performance score
  examples: string[];
  color: string;
}

// AI Insight data
export interface AIInsight {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  category: "creative" | "audience" | "budget" | "strategy";
  timestamp: string;
  confidence: number;
  actionable: boolean;
}

// Generate random performance metrics
function randomPerformance(min: number, max: number): number {
  return +(Math.random() * (max - min) + min).toFixed(2);
}

// Generate campaigns data
export function generateCampaigns(count: number = 10): CampaignPerformance[] {
  const campaigns: CampaignPerformance[] = [];
  
  const campaignTypes = [
    "Prospecting",
    "Retargeting",
    "Conversion",
    "Awareness",
    "Engagement"
  ];
  
  const products = [
    "Summer Collection",
    "Holiday Special",
    "Core Products",
    "New Arrivals",
    "Sale Items"
  ];
  
  for (let i = 0; i < count; i++) {
    const spend = randomPerformance(1000, 15000);
    const impressions = Math.floor(spend * randomPerformance(500, 1500));
    const clicks = Math.floor(impressions * randomPerformance(0.01, 0.08));
    const conversions = Math.floor(clicks * randomPerformance(0.05, 0.25));
    const revenue = spend * randomPerformance(0.5, 3.5);
    
    const type = campaignTypes[Math.floor(Math.random() * campaignTypes.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    
    const startMonth = Math.floor(Math.random() * 11) + 1;
    const startDay = Math.floor(Math.random() * 28) + 1;
    const durationDays = Math.floor(Math.random() * 60) + 30;
    
    const startDate = new Date(2023, startMonth, startDay);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + durationDays);
    
    campaigns.push({
      id: `camp-${i + 1}`,
      name: `${type} - ${product}`,
      spend,
      impressions,
      clicks,
      conversions,
      revenue,
      ctr: clicks / impressions,
      cpc: spend / clicks,
      roas: revenue / spend,
      mer: (revenue - spend) / spend,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  }
  
  return campaigns;
}

// Generate daily performance data
export function generateDailyData(days: number = 30): DailyPerformance[] {
  const data: DailyPerformance[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    const spend = randomPerformance(500, 1500);
    const revenue = spend * randomPerformance(0.8, 2.5);
    const impressions = Math.floor(spend * randomPerformance(400, 1200));
    const clicks = Math.floor(impressions * randomPerformance(0.01, 0.08));
    
    data.push({
      date: date.toISOString().split('T')[0],
      spend,
      revenue,
      roas: revenue / spend,
      impressions,
      clicks,
    });
  }
  
  return data;
}

// Generate creative themes
export function generateCreativeThemes(): CreativeTheme[] {
  const themes = [
    {
      id: "theme-1",
      name: "Testimonials",
      count: Math.floor(Math.random() * 50) + 20,
      performance: randomPerformance(1.1, 2.0),
      examples: ["Customer Story 1", "Customer Story 2", "Customer Success"],
      color: "#D3E4FD" // pastel blue
    },
    {
      id: "theme-2",
      name: "Product Features",
      count: Math.floor(Math.random() * 50) + 30,
      performance: randomPerformance(0.7, 1.3),
      examples: ["Feature Highlight", "Product Demo", "Feature Comparison"],
      color: "#F2FCE2" // pastel green
    },
    {
      id: "theme-3",
      name: "Lifestyle",
      count: Math.floor(Math.random() * 50) + 25,
      performance: randomPerformance(0.8, 1.5),
      examples: ["In Action", "Daily Use", "Lifestyle Integration"],
      color: "#FEC6A1" // pastel orange
    },
    {
      id: "theme-4",
      name: "Limited Time Offer",
      count: Math.floor(Math.random() * 40) + 15,
      performance: randomPerformance(1.5, 2.2),
      examples: ["Flash Sale", "Last Chance", "Special Discount"],
      color: "#FEF7CD" // pastel yellow
    },
    {
      id: "theme-5",
      name: "Educational",
      count: Math.floor(Math.random() * 30) + 10,
      performance: randomPerformance(0.6, 1.1),
      examples: ["How-To", "Tips & Tricks", "Problem-Solution"],
      color: "#E5DEFF" // pastel purple
    },
    {
      id: "theme-6",
      name: "Social Proof",
      count: Math.floor(Math.random() * 25) + 15,
      performance: randomPerformance(1.2, 1.8),
      examples: ["Reviews", "Ratings", "User Count"],
      color: "#FFDEE2" // pastel pink
    }
  ];
  
  return themes;
}

// Generate AI insights
export function generateAIInsights(): AIInsight[] {
  const insights: AIInsight[] = [
    {
      id: "insight-1",
      title: "Creative Fatigue Detected",
      description: "Your top-performing 'Customer Testimonial' creatives are showing signs of fatigue with declining CTR over the past 7 days. Consider refreshing these assets with new testimonials.",
      impact: "high",
      category: "creative",
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      confidence: 0.89,
      actionable: true
    },
    {
      id: "insight-2",
      title: "Audience Overlap Issue",
      description: "Significant audience overlap (42%) detected between 'Prospecting - New Arrivals' and 'Retargeting - Core Products' campaigns, potentially causing cost inflation.",
      impact: "medium",
      category: "audience",
      timestamp: new Date(Date.now() - 6 * 3600000).toISOString(),
      confidence: 0.76,
      actionable: true
    },
    {
      id: "insight-3",
      title: "Budget Allocation Opportunity",
      description: "Shifting 20% of budget from underperforming 'Awareness' campaign to high-ROAS 'Conversion' campaign could improve overall ROAS by an estimated 15%.",
      impact: "high",
      category: "budget",
      timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
      confidence: 0.92,
      actionable: true
    },
    {
      id: "insight-4",
      title: "New Creative Theme Identified",
      description: "A new theme has emerged around 'Sustainability' messaging with 1.4x better performance than account average. Consider developing more creative assets around this theme.",
      impact: "medium",
      category: "creative",
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      confidence: 0.81,
      actionable: true
    },
    {
      id: "insight-5",
      title: "Ad Scheduling Opportunity",
      description: "Performance peaks detected between 7-9pm on weekdays. Consider dayparting to focus budget during these high-conversion periods.",
      impact: "medium",
      category: "strategy",
      timestamp: new Date(Date.now() - 36 * 3600000).toISOString(),
      confidence: 0.85,
      actionable: true
    },
    {
      id: "insight-6",
      title: "Seasonal Trend Analysis",
      description: "Based on historical data, expect 30% increase in CPM during upcoming holiday season. Recommend preparing high-impact creatives to offset cost increases.",
      impact: "low",
      category: "strategy",
      timestamp: new Date(Date.now() - 48 * 3600000).toISOString(),
      confidence: 0.72,
      actionable: false
    }
  ];
  
  return insights;
}

// Key metrics for dashboard overview
export function generateKeyMetrics() {
  return {
    totalSpend: 152843.27,
    totalRevenue: 289541.93,
    roas: 1.89,
    mer: 0.89,
    impressions: 12538492,
    clicks: 587293,
    ctr: 0.047,
    cpc: 0.26,
    conversions: 23491,
    cpa: 6.51
  };
}

// Generate top-performing audiences
export function generateTopAudiences() {
  return [
    {
      name: "Lookalike - Purchasers 1%",
      performance: 2.54,
      reach: 1250000,
      spend: 37521.42
    },
    {
      name: "Interest - Fitness Enthusiasts",
      performance: 1.98,
      reach: 950000,
      spend: 28432.19
    },
    {
      name: "Retargeting - Add to Cart",
      performance: 3.12,
      reach: 125000,
      spend: 15329.84
    },
    {
      name: "Broad - Age 25-34",
      performance: 1.46,
      reach: 2100000,
      spend: 42871.93
    }
  ];
}
