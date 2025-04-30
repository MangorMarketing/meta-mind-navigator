
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

interface DashboardHeaderProps {
  title: string;
  onRefresh?: () => void;
}

export function DashboardHeader({ title, onRefresh }: DashboardHeaderProps) {
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
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
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
              <span>Last 30 Days</span>
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Select Period</DropdownMenuLabel>
            <DropdownMenuItem>Today</DropdownMenuItem>
            <DropdownMenuItem>Yesterday</DropdownMenuItem>
            <DropdownMenuItem>Last 7 Days</DropdownMenuItem>
            <DropdownMenuItem>Last 30 Days</DropdownMenuItem>
            <DropdownMenuItem>Last 90 Days</DropdownMenuItem>
            <DropdownMenuItem>Year to Date</DropdownMenuItem>
            <DropdownMenuItem>Custom Range...</DropdownMenuItem>
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
  );
}
