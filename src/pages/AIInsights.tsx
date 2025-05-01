
import { AppLayout } from "@/components/Layout/AppLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Lightbulb, 
  TrendingUp, 
  AlertCircle, 
  Target, 
  BarChart4, 
  Users, 
  ChevronRight,
  MessageCircle,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react";

// Mock AI insights data
const aiInsights = [
  {
    id: 1,
    title: "High-performing creative elements identified",
    description: "Our AI analysis found that product imagery with people using the product has 43% higher CTR than product-only images.",
    type: "opportunity",
    category: "creative",
    impact: "high",
    dateGenerated: "2025-04-28",
    status: "new"
  },
  {
    id: 2,
    title: "Audience segment underperforming",
    description: "The 18-24 age demographic is showing 27% lower conversion rates compared to other segments.",
    type: "issue",
    category: "audience",
    impact: "medium",
    dateGenerated: "2025-04-27",
    status: "new"
  },
  {
    id: 3,
    title: "Budget reallocation opportunity",
    description: "Shifting 15% of budget from weekday mornings to weekend evenings could increase ROAS by approximately 22%.",
    type: "opportunity",
    category: "budget",
    impact: "high",
    dateGenerated: "2025-04-26",
    status: "implemented"
  },
  {
    id: 4,
    title: "Ad fatigue detected in key campaign",
    description: "The 'Summer Sale' campaign is showing signs of ad fatigue with CTR dropping 18% week over week.",
    type: "issue",
    category: "performance",
    impact: "high",
    dateGenerated: "2025-04-25",
    status: "dismissed"
  },
  {
    id: 5,
    title: "Seasonal trend identified",
    description: "Based on historical data, we predict a 30% increase in conversion rates during the upcoming holiday season.",
    type: "opportunity",
    category: "trends",
    impact: "medium",
    dateGenerated: "2025-04-24",
    status: "new"
  },
  {
    id: 6,
    title: "New audience segment opportunity",
    description: "Our AI has identified a potential new audience segment of 'fitness enthusiasts' that shares traits with your best customers.",
    type: "opportunity",
    category: "audience",
    impact: "high",
    dateGenerated: "2025-04-23",
    status: "new"
  },
  {
    id: 7,
    title: "Creative testing recommendation",
    description: "Testing different call-to-action phrasings could yield up to 15% improvement in click-through rates.",
    type: "opportunity",
    category: "creative",
    impact: "medium",
    dateGenerated: "2025-04-22",
    status: "new"
  }
];

// Helper function to get icon based on insight category
const getCategoryIcon = (category: string) => {
  switch (category) {
    case "creative":
      return <Lightbulb className="h-5 w-5" />;
    case "audience":
      return <Users className="h-5 w-5" />;
    case "budget":
      return <TrendingUp className="h-5 w-5" />;
    case "performance":
      return <BarChart4 className="h-5 w-5" />;
    case "trends":
      return <Target className="h-5 w-5" />;
    default:
      return <Lightbulb className="h-5 w-5" />;
  }
};

// Helper function to get status icon
const getStatusIcon = (status: string) => {
  switch (status) {
    case "implemented":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "dismissed":
      return <XCircle className="h-4 w-4 text-gray-400" />;
    case "new":
      return <Clock className="h-4 w-4 text-blue-500" />;
    default:
      return <Clock className="h-4 w-4 text-blue-500" />;
  }
};

export default function AIInsights() {
  return (
    <AppLayout>
      <div className="page-transition">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
            <p className="text-muted-foreground">
              AI-powered recommendations to improve your campaign performance
            </p>
          </div>
          <Button className="bg-brand hover:bg-brand-dark">
            <MessageCircle className="mr-2 h-4 w-4" />
            Ask AI Assistant
          </Button>
        </div>

        <div className="mb-6">
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
              <TabsTrigger value="all">All Insights</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              <TabsTrigger value="issues">Issues</TabsTrigger>
              <TabsTrigger value="implemented">Implemented</TabsTrigger>
              <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Insight cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiInsights.map((insight) => (
            <Card key={insight.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className={`p-1 rounded-full ${
                      insight.category === 'creative' ? 'bg-purple-100' :
                      insight.category === 'audience' ? 'bg-blue-100' :
                      insight.category === 'budget' ? 'bg-green-100' :
                      insight.category === 'performance' ? 'bg-orange-100' : 'bg-gray-100'
                    }`}>
                      {getCategoryIcon(insight.category)}
                    </div>
                    <span className="text-sm font-medium capitalize">{insight.category}</span>
                  </div>
                  <Badge 
                    variant={insight.type === "opportunity" ? "default" : "destructive"}
                    className={insight.type === "opportunity" ? "bg-green-600" : ""}
                  >
                    {insight.type === "opportunity" ? "Opportunity" : "Issue"}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{insight.title}</CardTitle>
                <CardDescription className="text-sm">
                  Generated on {insight.dateGenerated}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{insight.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  {getStatusIcon(insight.status)}
                  <span className="capitalize">{insight.status}</span>
                </div>
                <Button variant="ghost" size="sm" className="text-sm">
                  View Details
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
