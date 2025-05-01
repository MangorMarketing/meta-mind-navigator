import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Image, 
  Video, 
  Calendar, 
  DollarSign, 
  MousePointer, 
  ShoppingCart,
  BarChart,
  Copy,
  Pause,
  Play,
  Archive,
  Share2,
  Download,
  Trash,
  TrendingUp,
  TrendingDown,
  Gauge,
  Lightbulb
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Creative } from "@/pages/CreativeLibrary";
import { CreativeTheme } from "@/utils/mockData";
import { PerformanceBenchmarkChart, BenchmarkMetric } from "./PerformanceBenchmarkChart";
import { BenchmarkComparison } from "./BenchmarkComparison";
import { AIInsights } from "./AIInsights";

interface CreativeDetailProps {
  creative: Creative;
  isOpen: boolean;
  onClose: () => void;
  themes: CreativeTheme[];
}

export function CreativeDetail({ creative, isOpen, onClose, themes }: CreativeDetailProps) {
  // Format helpers
  const formatNumber = (num: number, decimals = 0) => {
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  
  const formatCurrency = (num: number) => {
    return num.toLocaleString(undefined, { 
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  const formatPercent = (num: number) => {
    return (num * 100).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + '%';
  };
  
  // Get theme colors
  const getThemeColor = (themeName: string) => {
    const theme = themes.find(t => t.name === themeName);
    return theme?.color || "#F1F0FB"; // Default to soft gray
  };

  // Benchmark metrics for performance comparison
  const performanceMetrics: BenchmarkMetric[] = [
    {
      name: "CTR",
      value: creative.ctr,
      benchmark: 0.02, // 2% industry average CTR
      unit: "%",
      isHigherBetter: true
    },
    {
      name: "CPC",
      value: creative.spend / creative.clicks,
      benchmark: 1.2, // $1.20 industry average CPC
      unit: "$",
      isHigherBetter: false
    },
    {
      name: "ROAS",
      value: creative.roas,
      benchmark: 2.5, // 2.5x industry average ROAS
      unit: "x",
      isHigherBetter: true
    },
    {
      name: "CPM",
      value: (creative.spend / creative.impressions) * 1000,
      benchmark: 7.0, // $7.00 industry average CPM
      unit: "$",
      isHigherBetter: false
    },
    {
      name: "Conv Rate",
      value: creative.conversions / creative.clicks,
      benchmark: 0.03, // 3% industry average conversion rate
      unit: "%",
      isHigherBetter: true
    }
  ];

  // Platform benchmark comparison
  const platformBenchmarks: BenchmarkMetric[] = [
    {
      name: "Instagram Feed",
      value: creative.ctr * 1.1, // 10% better than overall
      benchmark: 0.018,
      unit: "%",
      isHigherBetter: true
    },
    {
      name: "Facebook Feed",
      value: creative.ctr * 0.9, // 10% worse than overall
      benchmark: 0.015,
      unit: "%",
      isHigherBetter: true
    },
    {
      name: "Instagram Stories",
      value: creative.ctr * 1.3, // 30% better
      benchmark: 0.022,
      unit: "%",
      isHigherBetter: true
    },
    {
      name: "Facebook Right Column",
      value: creative.ctr * 0.7, // 30% worse
      benchmark: 0.012,
      unit: "%",
      isHigherBetter: true
    }
  ];
  
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full max-w-3xl overflow-y-auto sm:max-w-xl md:max-w-2xl">
        <SheetHeader className="mb-6">
          <SheetTitle>{creative.name}</SheetTitle>
          <SheetDescription>
            Creative ID: {creative.id}
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6">
          {/* Preview */}
          <div className="rounded-lg bg-muted aspect-video overflow-hidden relative">
            <img 
              src={creative.url}
              alt={creative.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute top-3 right-3">
              <Badge 
                variant="secondary" 
                className="bg-black/70 text-white hover:bg-black/80"
              >
                {creative.type === "image" ? (
                  <><Image className="mr-1 h-3 w-3" /> Image</>
                ) : (
                  <><Video className="mr-1 h-3 w-3" /> Video</>
                )}
              </Badge>
            </div>
          </div>
          
          {/* Status and Action Buttons */}
          <div className="flex items-center justify-between">
            <Badge 
              variant={
                creative.status === "active" ? "default" :
                creative.status === "paused" ? "outline" : "secondary"
              }
              className={cn(
                "px-3 py-1 text-sm font-medium",
                creative.status === "active" ? "bg-green-600 hover:bg-green-700" :
                creative.status === "paused" ? "bg-yellow-600 hover:bg-yellow-700" : 
                "bg-gray-600 hover:bg-gray-700"
              )}
            >
              {creative.status.charAt(0).toUpperCase() + creative.status.slice(1)}
            </Badge>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-1" />
                Duplicate
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className={creative.status === "active" ? "text-yellow-600" : "text-green-600"}
              >
                {creative.status === "active" ? (
                  <><Pause className="h-4 w-4 mr-1" /> Pause</>
                ) : (
                  <><Play className="h-4 w-4 mr-1" /> Activate</>
                )}
              </Button>
            </div>
          </div>
          
          {/* Date Range */}
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            <span>
              Active from {creative.startDate} to {creative.endDate}
            </span>
          </div>
          
          {/* Creative Themes */}
          <div>
            <h4 className="text-sm font-medium mb-2">Themes</h4>
            <div className="flex flex-wrap gap-2">
              {creative.themes.map((theme) => (
                <div
                  key={theme}
                  className="rounded-md px-2 py-1 text-sm"
                  style={{ backgroundColor: getThemeColor(theme) }}
                >
                  {theme}
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
          
          {/* Performance Tabs */}
          <Tabs defaultValue="metrics">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
              <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
              <TabsTrigger value="platforms">Platform Comparison</TabsTrigger>
              <TabsTrigger value="audiences">Audiences</TabsTrigger>
              <TabsTrigger value="insights" className="relative">
                Insights
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  5
                </span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="metrics" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border rounded-lg p-3">
                  <div className="flex items-center text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span className="text-xs">Spend</span>
                  </div>
                  <div className="text-lg font-medium">{formatCurrency(creative.spend)}</div>
                </div>
                
                <div className="bg-card border rounded-lg p-3">
                  <div className="flex items-center text-muted-foreground mb-1">
                    <BarChart className="h-4 w-4 mr-1" />
                    <span className="text-xs">Impressions</span>
                  </div>
                  <div className="text-lg font-medium">{formatNumber(creative.impressions)}</div>
                </div>
                
                <div className="bg-card border rounded-lg p-3">
                  <div className="flex items-center text-muted-foreground mb-1">
                    <MousePointer className="h-4 w-4 mr-1" />
                    <span className="text-xs">CTR</span>
                  </div>
                  <div className="text-lg font-medium">{formatPercent(creative.ctr)}</div>
                </div>
                
                <div className="bg-card border rounded-lg p-3">
                  <div className="flex items-center text-muted-foreground mb-1">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    <span className="text-xs">ROAS</span>
                  </div>
                  <div className="text-lg font-medium">
                    {creative.roas.toFixed(2)}x
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium mb-2">Additional Metrics</h4>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Clicks</div>
                    <div>{formatNumber(creative.clicks)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Conversions</div>
                    <div>{formatNumber(creative.conversions)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Revenue</div>
                    <div>{formatCurrency(creative.revenue)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">CPC</div>
                    <div>{formatCurrency(creative.spend / creative.clicks)}</div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="benchmarks" className="space-y-4 pt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <Gauge className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="text-lg font-semibold">Performance Grade</h3>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-white font-semibold",
                      creative.performance >= 1.5 ? "bg-green-600" :
                      creative.performance >= 1 ? "bg-green-500" :
                      creative.performance >= 0.8 ? "bg-yellow-500" : "bg-red-500"
                    )}>
                      {creative.performance >= 1.5 ? "A" :
                       creative.performance >= 1.3 ? "B" :
                       creative.performance >= 1 ? "C" :
                       creative.performance >= 0.8 ? "D" : "F"}
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">
                    This creative is performing 
                    <span className={cn(
                      "font-semibold mx-1",
                      creative.performance >= 1 ? "text-green-600" : "text-red-600"
                    )}>
                      {creative.performance >= 1 ? 
                        `${((creative.performance - 1) * 100).toFixed(0)}% above` : 
                        `${((1 - creative.performance) * 100).toFixed(0)}% below`
                      }
                    </span>
                    the account average.
                  </p>
                  
                  <PerformanceBenchmarkChart metrics={performanceMetrics} />
                </CardContent>
              </Card>
              
              <BenchmarkComparison 
                metrics={performanceMetrics}
                comparisonTitle="Industry Benchmark Comparison"
              />
            </TabsContent>
            
            <TabsContent value="platforms" className="space-y-4 pt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Platform Performance</h3>
                    <p className="text-muted-foreground">
                      Compare how this creative performs across different placement types
                    </p>
                  </div>
                  
                  <BenchmarkComparison 
                    metrics={platformBenchmarks}
                    comparisonTitle="Platform CTR Comparison"
                  />
                </CardContent>
              </Card>
              
              <div className="rounded-lg border p-4 bg-card">
                <h4 className="text-sm font-medium mb-3">Best Performing Platforms</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm">Instagram Stories</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">+30% vs avg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm">Instagram Feed</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">+10% vs avg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm">Facebook Feed</span>
                    </div>
                    <span className="text-sm font-medium text-red-600">-10% vs avg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm">Facebook Right Column</span>
                    </div>
                    <span className="text-sm font-medium text-red-600">-30% vs avg</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="audiences" className="space-y-4 pt-4">
              <div className="rounded-lg border p-4 bg-card">
                <h4 className="text-sm font-medium mb-2">Top Performing Audiences</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Lookalike - Purchasers 1%</span>
                    <span className="text-sm font-medium text-green-600">2.1x ROAS</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Interest - Fitness Enthusiasts</span>
                    <span className="text-sm font-medium text-green-600">1.8x ROAS</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Retargeting - Add to Cart</span>
                    <span className="text-sm font-medium text-green-600">3.5x ROAS</span>
                  </div>
                </div>
              </div>
              
              <div className="rounded-lg border p-4 bg-card">
                <h4 className="text-sm font-medium mb-2">Demographic Performance</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-muted-foreground">Age</span>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">25-34</span>
                      <span className="text-sm font-medium text-green-600">Best</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Gender</span>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Female</span>
                      <span className="text-sm font-medium text-green-600">+22%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Device</span>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Mobile</span>
                      <span className="text-sm font-medium text-green-600">+15%</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="insights" className="space-y-4 pt-4">
              <AIInsights creative={creative} />
            </TabsContent>
          </Tabs>
          
          <Separator />
          
          {/* Additional Actions */}
          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
            <Button variant="outline" size="sm" className="text-destructive">
              <Trash className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
        
        <SheetClose asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute right-4 top-4"
          >
            Close
          </Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}
