
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
  Trash 
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Creative } from "@/pages/CreativeLibrary";
import { CreativeTheme } from "@/utils/mockData";

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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
              <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
              <TabsTrigger value="audiences">Audiences</TabsTrigger>
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
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Performance vs Account Average</span>
                  <span className={cn(
                    "text-sm font-medium",
                    creative.performance >= 1 ? "text-green-600" : "text-red-600"
                  )}>
                    {creative.performance.toFixed(2)}x
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">CTR vs Account Average</span>
                  <span className={cn(
                    "text-sm font-medium",
                    creative.ctr >= 0.02 ? "text-green-600" : "text-red-600"
                  )}>
                    {(creative.ctr / 0.02).toFixed(2)}x
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">ROAS vs Account Average</span>
                  <span className={cn(
                    "text-sm font-medium",
                    creative.roas >= 1.5 ? "text-green-600" : "text-red-600"
                  )}>
                    {(creative.roas / 1.5).toFixed(2)}x
                  </span>
                </div>
              </div>
              
              <div className="rounded-lg border p-4 bg-card/50">
                <h4 className="text-sm font-medium mb-2">Performance by Platform Placement</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Facebook Feed</span>
                    <span className="text-sm font-medium">+12%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Instagram Feed</span>
                    <span className="text-sm font-medium">+8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Instagram Stories</span>
                    <span className="text-sm font-medium">+23%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Facebook Right Column</span>
                    <span className="text-sm font-medium">-5%</span>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="audiences" className="space-y-4 pt-4">
              <div className="rounded-lg border p-4 bg-card/50">
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
              
              <div className="rounded-lg border p-4 bg-card/50">
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
