
import { useState } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { CreativeHeader } from "@/components/CreativeLibrary/CreativeHeader";
import { CreativeFilters } from "@/components/CreativeLibrary/CreativeFilters";
import { CreativeGrid } from "@/components/CreativeLibrary/CreativeGrid";
import { CreativeDetail } from "@/components/CreativeLibrary/CreativeDetail";
import { generateCreativeThemes, generateCreatives } from "@/utils/mockData";

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
}

export default function CreativeLibrary() {
  const [creatives, setCreatives] = useState<Creative[]>(() => generateCreatives());
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
      setCreatives(generateCreatives());
      setIsLoading(false);
    }, 800);
  };
  
  const handleSelectCreative = (creative: Creative) => {
    setSelectedCreative(creative);
    setIsDetailOpen(true);
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
    if (filters.type && creative.type !== filters.type) {
      return false;
    }
    
    // Filter by theme
    if (filters.theme && !creative.themes.includes(filters.theme)) {
      return false;
    }
    
    // Filter by status
    if (filters.status && creative.status !== filters.status) {
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
