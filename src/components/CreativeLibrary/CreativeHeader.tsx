
import { Button } from "@/components/ui/button";
import { RefreshCcw, Upload, Download } from "lucide-react";

interface CreativeHeaderProps {
  title: string;
  creativeCount: number;
  totalCreatives: number;
  onRefresh: () => void;
  isLoading: boolean;
}

export function CreativeHeader({ 
  title, 
  creativeCount, 
  totalCreatives, 
  onRefresh, 
  isLoading 
}: CreativeHeaderProps) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">
          Showing {creativeCount} of {totalCreatives} creatives
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          {isLoading ? "Refreshing..." : "Refresh"}
        </Button>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
