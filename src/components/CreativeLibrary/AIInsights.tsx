
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ArrowRight, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Creative } from "@/pages/CreativeLibrary";

interface InsightCategory {
  id: string;
  name: string;
  color: string;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  timeToImplement: "quick" | "moderate" | "extensive";
  category: string;
  action?: string;
}

interface AIInsightsProps {
  creative: Creative;
}

export function AIInsights({ creative }: AIInsightsProps) {
  // These would normally come from an API or be generated based on the creative's performance data
  const insightCategories: InsightCategory[] = [
    { id: "audience", name: "Audience", color: "#8B5CF6" },
    { id: "creative", name: "Creative", color: "#EC4899" },
    { id: "placement", name: "Placement", color: "#10B981" },
    { id: "budget", name: "Budget", color: "#F59E0B" }
  ];

  // Sample insights based on creative data
  const insights: Insight[] = [
    {
      id: "1",
      title: "Optimize for mobile devices",
      description: `Your creative performs 30% better on mobile devices than desktop. 
                    Consider allocating more budget to mobile placements.`,
      impact: "high",
      timeToImplement: "quick",
      category: "placement",
      action: "Adjust targeting"
    },
    {
      id: "2",
      title: "Adjust creative contrast",
      description: `The contrast ratio between text and background is below optimal levels. 
                    Improving this could increase readability and conversion rates.`,
      impact: "medium",
      timeToImplement: "quick",
      category: "creative",
      action: "Edit creative"
    },
    {
      id: "3",
      title: "Target lookalike audience",
      description: `Based on conversion data, creating a 1% lookalike audience from 
                    your converting users could improve performance by up to 20%.`,
      impact: "high",
      timeToImplement: "moderate",
      category: "audience",
      action: "Create audience"
    },
    {
      id: "4",
      title: "Adjust daily budget",
      description: `This creative consistently exhausts its daily budget before 3PM. 
                    Consider increasing budget by 30% to capture more conversions.`,
      impact: "medium",
      timeToImplement: "quick",
      category: "budget",
      action: "Modify budget"
    },
    {
      id: "5",
      title: "Test alternative CTA",
      description: `Based on industry benchmarks, testing alternative CTA text like 
                    "Get Started" instead of "Learn More" could improve CTR by 15%.`,
      impact: "medium",
      timeToImplement: "quick",
      category: "creative",
      action: "Create variant"
    }
  ];

  // Helper function for impact colors
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-green-100 text-green-800 border-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Helper function for time to implement
  const getTimeIcon = (time: string) => {
    switch (time) {
      case "quick":
        return <Clock className="h-3 w-3" />;
      case "moderate":
        return <Clock className="h-3 w-3" />;
      case "extensive":
        return <Clock className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Get category color
  const getCategoryColor = (categoryId: string) => {
    const category = insightCategories.find(cat => cat.id === categoryId);
    return category?.color || "#CBD5E0";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">AI-Driven Insights</h3>
        </div>
        <Badge variant="outline" className="bg-primary/10">
          5 Optimization Opportunities
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {insights.map((insight) => (
          <Card key={insight.id} className="overflow-hidden">
            <div
              className="h-1"
              style={{ backgroundColor: getCategoryColor(insight.category) }}
            />
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">
                  {insight.title}
                </CardTitle>
                <Badge 
                  variant="outline" 
                  className={cn("border", getImpactColor(insight.impact))}
                >
                  {insight.impact} impact
                </Badge>
              </div>

              <div className="flex gap-1.5 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-0.5">
                  {getTimeIcon(insight.timeToImplement)}
                  <span className="capitalize">{insight.timeToImplement}</span>
                </span>
                <span>•</span>
                <span>
                  {insightCategories.find(cat => cat.id === insight.category)?.name}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {insight.description}
              </p>
              {insight.action && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full flex justify-between items-center"
                >
                  {insight.action}
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-primary/5 border-dashed">
        <CardContent className="pt-6 flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="font-medium">Get more optimization insights</h4>
            <p className="text-sm text-muted-foreground">
              Run an advanced AI analysis to uncover more opportunities
            </p>
          </div>
          <Button>
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Run analysis
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
