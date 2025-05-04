
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { Creative } from "@/pages/CreativeLibrary";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface CreativeCardProps {
  creative: Creative;
  onClick: () => void;
}

export function CreativeCard({ creative, onClick }: CreativeCardProps) {
  const [imageError, setImageError] = useState(false);
  
  // Format currency values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentages
  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Helper to get performance class
  const getPerformanceClass = (performance: number) => {
    if (performance >= 1.2) return "bg-green-600 text-white";
    if (performance >= 1) return "bg-green-500 text-white";
    if (performance >= 0.8) return "bg-yellow-500 text-white";
    return "bg-red-500 text-white";
  };

  return (
    <Card 
      className="overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <div className="aspect-video w-full overflow-hidden bg-muted relative">
        {!imageError && (creative.url || creative.thumbnailUrl) ? (
          <img
            src={creative.url || creative.thumbnailUrl}
            alt={creative.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              // If image fails to load, mark it as error and use fallback
              setImageError(true);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted text-muted-foreground">
            {creative.name.substring(0, 30)}...
          </div>
        )}
        
        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <Badge 
            variant={
              creative.status === "active" ? "default" :
              creative.status === "paused" ? "outline" : "secondary"
            }
            className={cn(
              creative.status === "active" ? "bg-green-600 hover:bg-green-700" :
              creative.status === "paused" ? "bg-yellow-600 hover:bg-yellow-700" : 
              "bg-gray-600 hover:bg-gray-700"
            )}
          >
            {creative.status.charAt(0).toUpperCase() + creative.status.slice(1)}
          </Badge>
        </div>
        
        {/* AI insights badge */}
        {creative.aiInsightsCount && creative.aiInsightsCount > 0 && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="bg-primary/80 text-white border-primary-foreground/20 flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              {creative.aiInsightsCount} insights
            </Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="mb-2 line-clamp-2 font-medium">
          {creative.name || "Untitled Creative"}
        </div>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {creative.themes.slice(0, 2).map((theme, index) => (
            <Badge key={`${theme}-${index}`} variant="secondary" className="text-xs">
              {theme}
            </Badge>
          ))}
          {creative.themes.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{creative.themes.length - 2} more
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="text-muted-foreground">Spend</div>
          <div className="text-right">{formatCurrency(creative.spend)}</div>
          
          <div className="text-muted-foreground">CTR</div>
          <div className="text-right">{formatPercent(creative.ctr)}</div>
          
          <div className="text-muted-foreground">Performance</div>
          <div className="text-right">
            <Badge className={cn("font-medium", getPerformanceClass(creative.performance))}>
              {creative.performance.toFixed(1)}x
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
