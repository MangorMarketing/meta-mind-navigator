
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Image, Video, TrendingUp, TrendingDown, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { Creative } from "@/pages/CreativeLibrary";

interface CreativeCardProps {
  creative: Creative;
  onClick: () => void;
}

export function CreativeCard({ creative, onClick }: CreativeCardProps) {
  // Format functions
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };
  
  const formatCurrency = (num: number) => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num.toFixed(2)}`;
  };
  
  // Determine performance indicator and grade
  const isGoodPerformance = creative.performance >= 1.0;
  const getPerformanceGrade = () => {
    if (creative.performance >= 1.5) return "A";
    if (creative.performance >= 1.3) return "B";
    if (creative.performance >= 1.0) return "C";
    if (creative.performance >= 0.8) return "D";
    return "F";
  };
  
  const getGradeColor = () => {
    if (creative.performance >= 1.3) return "bg-green-600";
    if (creative.performance >= 1.0) return "bg-green-500";
    if (creative.performance >= 0.8) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  return (
    <Card 
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-video bg-muted">
        {/* Creative thumbnail */}
        <img 
          src={creative.thumbnailUrl}
          alt={creative.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        
        {/* Type indicator */}
        <div className="absolute top-2 right-2">
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
        
        {/* Status indicator */}
        <div className="absolute bottom-2 left-2">
          <Badge 
            variant={
              creative.status === "active" ? "default" :
              creative.status === "paused" ? "outline" : "secondary"
            }
            className={
              creative.status === "active" ? "bg-green-600 hover:bg-green-700" :
              creative.status === "paused" ? "bg-yellow-600 hover:bg-yellow-700" : 
              "bg-gray-600 hover:bg-gray-700"
            }
          >
            {creative.status.charAt(0).toUpperCase() + creative.status.slice(1)}
          </Badge>
        </div>
        
        {/* Performance Grade */}
        <div className="absolute bottom-2 right-2">
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-xs",
            getGradeColor()
          )}>
            {getPerformanceGrade()}
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-medium line-clamp-1 mb-2">{creative.name}</h3>
        
        <div className="flex gap-1 flex-wrap mb-3">
          {creative.themes.map((theme) => (
            <Badge key={theme} variant="outline" className="bg-card text-xs">
              {theme}
            </Badge>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Impressions</span>
            <span className="font-medium">{formatNumber(creative.impressions)}</span>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Spend</span>
            <span className="font-medium">{formatCurrency(creative.spend)}</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className={cn(
          "flex items-center gap-1 text-sm font-medium",
          isGoodPerformance ? "text-green-600" : "text-red-600"
        )}>
          {isGoodPerformance ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          {creative.performance.toFixed(1)}x
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground">
          <Gauge className="h-3 w-3 mr-1" />
          <span>vs. benchmarks</span>
        </div>
      </CardFooter>
    </Card>
  );
}
