
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { CreativeHeader } from "@/components/CreativeLibrary/CreativeHeader";
import { CreativeFilters } from "@/components/CreativeLibrary/CreativeFilters";
import { CreativeGrid } from "@/components/CreativeLibrary/CreativeGrid";
import { CreativeDetail } from "@/components/CreativeLibrary/CreativeDetail";
import { generateCreativeThemes, generateCreatives } from "@/utils/mockData";
import { generateInsightsForCreative } from "@/utils/aiInsights";
import { toast } from "@/components/ui/use-toast";

export interface Creative {
  id: string;
  name: string;
  type: "image" | "video";
  url: string;
  thumbnailUrl: string;
  performance: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  spend: number;
  revenue: number;
  roas: number;
  startDate: string;
  endDate: string;
  themes: string[];
  status: "active" | "paused" | "archived";
  // Benchmarking data
  benchmarks?: {
    industry?: {
      ctr: number;
      cpc: number;
      cpm: number;
      convRate: number;
      roas: number;
    };
    account?: {
      ctr: number;
      cpc: number;
      cpm: number;
      convRate: number;
      roas: number;
    };
    platforms?: {
      [key: string]: {
        ctr: number;
        cpc: number;
        convRate: number;
      };
    };
  };
  // AI insights data
  aiInsightsCount?: number;
}

export default function CreativeLibrary() {
  const [creatives, setCreatives] = useState<Creative[]>(() => {
    const initialCreatives = generateCreatives();
    
    // Add AI insights counts to creatives
    return initialCreatives.map(creative => ({
      ...creative,
      aiInsightsCount: Math.floor(Math.random() * 6) + 1  // Random 1-6 insights
    }));
  });
  
  const [themes] = useState(() => generateCreativeThemes());
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    theme: "",
    status: "",
    performanceMin: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      const newCreatives = generateCreatives().map(creative => ({
        ...creative,
        aiInsightsCount: Math.floor(Math.random() * 6) + 1  // Random 1-6 insights
      }));
      
      setCreatives(newCreatives);
      toast({
        title: "Creative library refreshed",
        description: "The latest creative performance data and AI insights have been loaded.",
      });
      setIsLoading(false);
    }, 800);
  };
  
  const handleSelectCreative = (creative: Creative) => {
    // When a creative is selected, we could generate real-time insights
    // This simulates an API call to get insights
    setSelectedCreative(creative);
    setIsDetailOpen(true);
    
    // In a real app, this would be an API call to generate insights
    // For demo purposes, we'll just show a toast to simulate this happening
    setTimeout(() => {
      toast({
        title: "AI insights generated",
        description: `${creative.aiInsightsCount} optimization opportunities identified for "${creative.name}"`,
      });
    }, 500);
  };
  
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };
  
  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  const filteredCreatives = creatives.filter(creative => {
    // Filter by search term
    if (filters.search && !creative.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Filter by type
    if (filters.type && filters.type !== "all" && creative.type !== filters.type) {
      return false;
    }
    
    // Filter by theme
    if (filters.theme && filters.theme !== "all" && !creative.themes.includes(filters.theme)) {
      return false;
    }
    
    // Filter by status
    if (filters.status && filters.status !== "all" && creative.status !== filters.status) {
      return false;
    }
    
    // Filter by minimum performance
    if (creative.performance < filters.performanceMin) {
      return false;
    }
    
    return true;
  });
  
  return (
    <AppLayout>
      <div className="page-transition space-y-6">
        <CreativeHeader 
          title="Creative Library"
          onRefresh={handleRefresh}
          creativeCount={filteredCreatives.length}
          totalCreatives={creatives.length}
          isLoading={isLoading}
        />
        
        <CreativeFilters 
          filters={filters}
          onFilterChange={handleFilterChange}
          themes={themes}
        />
        
        <CreativeGrid 
          creatives={filteredCreatives}
          onSelect={handleSelectCreative}
          isLoading={isLoading}
        />
        
        {selectedCreative && (
          <CreativeDetail
            creative={selectedCreative}
            isOpen={isDetailOpen}
            onClose={handleCloseDetail}
            themes={themes}
          />
        )}
      </div>
    </AppLayout>
  );
}
