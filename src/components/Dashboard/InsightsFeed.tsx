
import { Lightbulb, AlertTriangle, TrendingUp, Target, Zap } from "lucide-react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AIInsight } from "@/utils/mockData";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface InsightsFeedProps {
  insights: AIInsight[];
  className?: string;
}

export function InsightsFeed({ insights, className }: InsightsFeedProps) {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Function to format relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const insightTime = new Date(timestamp);
    const diffMs = now.getTime() - insightTime.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHrs < 1) {
      return "Just now";
    } else if (diffHrs === 1) {
      return "1 hour ago";
    } else if (diffHrs < 24) {
      return `${diffHrs} hours ago`;
    } else {
      const diffDays = Math.floor(diffHrs / 24);
      return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
    }
  };
  
  // Get icon for category
  const getInsightIcon = (category: string) => {
    switch (category) {
      case "creative": 
        return <Lightbulb className="h-5 w-5" />;
      case "audience": 
        return <Target className="h-5 w-5" />;
      case "budget": 
        return <TrendingUp className="h-5 w-5" />;
      case "strategy": 
        return <Zap className="h-5 w-5" />;
      default: 
        return <AlertTriangle className="h-5 w-5" />;
    }
  };
  
  // Get color for impact
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-green-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };
  
  const handleApply = (insight: AIInsight) => {
    toast({
      title: "Applying Insight",
      description: `You're applying: ${insight.title}`
    });
  };
  
  const handleDismiss = (insight: AIInsight) => {
    toast({
      title: "Insight Dismissed",
      description: "The insight has been dismissed from your feed."
    });
  };
  
  const handleMore = (insight: AIInsight) => {
    setExpandedInsight(expandedInsight === insight.id ? null : insight.id);
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-brand" />
              AI Insights
            </CardTitle>
            <CardDescription>Performance opportunities detected by AI</CardDescription>
          </div>
          <Badge className="bg-brand hover:bg-brand-dark">
            {insights.length} New
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => (
            <div 
              key={insight.id} 
              className="insight-card"
            >
              <div className="flex items-start gap-3">
                <div 
                  className={`p-2 rounded-full ${getImpactColor(insight.impact)} text-white`}
                >
                  {getInsightIcon(insight.category)}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{insight.title}</h3>
                    <Badge variant="outline" className="capitalize">
                      {insight.category}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground my-2">
                    {insight.description}
                  </p>
                  
                  {expandedInsight === insight.id && (
                    <div className="mt-3 p-3 bg-muted/30 rounded-md text-sm">
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">AI Confidence</span>
                        <span className="font-medium">{(insight.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mb-3">
                        <div 
                          className="bg-brand h-2 rounded-full" 
                          style={{ width: `${insight.confidence * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This insight was generated based on pattern analysis of your ad performance 
                        data over the last 30 days, with comparisons to historical benchmarks.
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-muted-foreground">
                      {formatRelativeTime(insight.timestamp)}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleMore(insight)}
                      >
                        {expandedInsight === insight.id ? "Less" : "More"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDismiss(insight)}
                      >
                        Dismiss
                      </Button>
                      {insight.actionable && (
                        <Button 
                          size="sm"
                          className="bg-brand hover:bg-brand-dark"
                          onClick={() => handleApply(insight)}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
