
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  RefreshCw, 
  Calendar, 
  ChevronDown,
  Share,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { AdAccountSelector } from "./AdAccountSelector";
import { useState } from "react";

export type DateRange = "today" | "yesterday" | "last_7_days" | "last_30_days" | "last_90_days";

interface DashboardHeaderProps {
  title: string;
  onRefresh?: () => void;
  currentAdAccountId?: string | null;
  onAdAccountChange?: (adAccountId: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

export function DashboardHeader({ 
  title, 
  onRefresh, 
  currentAdAccountId, 
  onAdAccountChange,
  dateRange,
  onDateRangeChange
}: DashboardHeaderProps) {
  const { toast } = useToast();
  
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      toast({
        title: "Refreshing Data",
        description: "Your dashboard data is being updated..."
      });
      
      // Simulate refresh
      setTimeout(() => {
        toast({
          title: "Data Updated",
          description: "Dashboard refreshed with latest data"
        });
      }, 1500);
    }
  };
  
  const handleExport = () => {
    toast({
      title: "Exporting Data",
      description: "Your data export is being prepared..."
    });
    
    // Simulate export
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Data successfully exported to CSV"
      });
    }, 2000);
  };

  const handleDateRangeChange = (range: DateRange) => {
    onDateRangeChange(range);
    toast({
      title: "Date Range Updated",
      description: `Data now showing for: ${range.replace('_', ' ')}`
    });
  };
  
  const formatDateRangeDisplay = (range: DateRange): string => {
    switch (range) {
      case "today": return "Today";
      case "yesterday": return "Yesterday";
      case "last_7_days": return "Last 7 Days";
      case "last_30_days": return "Last 30 Days";
      case "last_90_days": return "Last 90 Days";
      default: return "Last 30 Days";
    }
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-muted-foreground text-sm">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{formatDateRangeDisplay(dateRange)}</span>
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select Period</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleDateRangeChange("today")}>Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateRangeChange("yesterday")}>Yesterday</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateRangeChange("last_7_days")}>Last 7 Days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateRangeChange("last_30_days")}>Last 30 Days</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDateRangeChange("last_90_days")}>Last 90 Days</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Filter size={16} />
            <span>Filters</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleExport}
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </Button>
          
          <Button 
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-brand hover:bg-brand-dark"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Share size={16} />
            <span className="hidden sm:inline">Share</span>
          </Button>
        </div>
      </div>

      {currentAdAccountId && onAdAccountChange && (
        <div className="mb-2">
          <AdAccountSelector 
            currentAdAccountId={currentAdAccountId} 
            onAdAccountChange={onAdAccountChange} 
          />
        </div>
      )}
    </div>
  );
}
