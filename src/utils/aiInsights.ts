
import { Creative } from "@/pages/CreativeLibrary";
import { Insight } from "@/components/CreativeLibrary/AIInsights";

// Placeholder function to simulate AI-generated insights
// In a real app, this would call an API or ML model
export function generateInsightsForCreative(creative: Creative): Insight[] {
  // Base set of insights - in a real app, these would be dynamically generated
  const insights: Insight[] = [
    {
      id: "base-1",
      title: "Optimize for mobile devices",
      description: "Your creative performs better on mobile devices than desktop. Consider allocating more budget to mobile placements.",
      impact: "high",
      timeToImplement: "quick",
      category: "placement",
      action: "Adjust targeting"
    },
    {
      id: "base-2",
      title: "Test alternative CTA",
      description: "Based on industry benchmarks, testing alternative CTA text could improve CTR.",
      impact: "medium",
      timeToImplement: "quick",
      category: "creative",
      action: "Create variant"
    }
  ];

  // Add creative-specific insights based on performance metrics
  
  // CTR insights
  if (creative.ctr < 0.01) {
    insights.push({
      id: "ctr-low",
      title: "Improve ad clarity",
      description: "Your CTR is below industry average. Consider making your message clearer and more compelling.",
      impact: "high",
      timeToImplement: "moderate",
      category: "creative",
      action: "Edit creative"
    });
  } else if (creative.ctr > 0.03) {
    insights.push({
      id: "ctr-high",
      title: "Expand audience reach",
      description: "Strong CTR indicates good creative resonance. Try expanding your audience to reach more similar users.",
      impact: "medium",
      timeToImplement: "quick",
      category: "audience",
      action: "Expand targeting"
    });
  }
  
  // ROAS insights
  if (creative.roas < 1) {
    insights.push({
      id: "roas-low",
      title: "Optimize bidding strategy",
      description: "Your ROAS is below 1, meaning you're spending more than earning. Consider lowering bids or improving conversion path.",
      impact: "high",
      timeToImplement: "moderate",
      category: "budget",
      action: "Adjust bidding"
    });
  } else if (creative.roas > 3) {
    insights.push({
      id: "roas-high",
      title: "Increase budget allocation",
      description: "Excellent ROAS of over 3x. Consider increasing budget to capture more high-value conversions.",
      impact: "high",
      timeToImplement: "quick",
      category: "budget",
      action: "Increase budget"
    });
  }

  // Conversion insights
  const convRate = creative.conversions / creative.clicks;
  if (convRate < 0.02) {
    insights.push({
      id: "conv-low",
      title: "Improve landing page experience",
      description: "Low conversion rate suggests issues with the post-click experience. Review landing page and conversion funnel.",
      impact: "high",
      timeToImplement: "extensive",
      category: "creative",
      action: "Review funnel"
    });
  }

  // Add theme-specific insights
  if (creative.themes.includes("Summer")) {
    insights.push({
      id: "theme-summer",
      title: "Leverage seasonal targeting",
      description: "Your summer-themed creative could perform better with weather-targeted campaigns in relevant regions.",
      impact: "medium",
      timeToImplement: "moderate",
      category: "placement",
      action: "Add targeting"
    });
  }
  
  if (creative.themes.includes("Promotion")) {
    insights.push({
      id: "theme-promo",
      title: "Add urgency elements",
      description: "Add countdown timers or limited-time messaging to your promotional creative to increase conversion urgency.",
      impact: "medium",
      timeToImplement: "quick",
      category: "creative",
      action: "Edit creative"
    });
  }

  // Return a subset of insights (max 5) to avoid overwhelming the user
  return insights.slice(0, 5);
}
