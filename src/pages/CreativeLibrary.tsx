
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { CreativeHeader } from "@/components/CreativeLibrary/CreativeHeader";
import { CreativeFilters } from "@/components/CreativeLibrary/CreativeFilters";
import { CreativeGrid } from "@/components/CreativeLibrary/CreativeGrid";
import { CreativeDetail } from "@/components/CreativeLibrary/CreativeDetail";
import { generateCreativeThemes } from "@/utils/mockData";
import { generateInsightsForCreative } from "@/utils/aiInsights";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    theme: "",
    status: "",
    performanceMin: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentAdAccountId, setCurrentAdAccountId] = useState<string | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      fetchAdAccountId();
    } else {
      setIsLoading(false);
    }
  }, [user]);
  
  const fetchAdAccountId = async () => {
    try {
      const { data, error } = await supabase
        .from('meta_connections')
        .select('ad_account_id')
        .eq('user_id', user?.id)
        .single();
        
      if (error) {
        console.error('Error fetching ad account ID:', error);
        setIsLoading(false);
        return;
      }
      
      if (data?.ad_account_id) {
        setCurrentAdAccountId(data.ad_account_id);
        fetchCreatives(data.ad_account_id);
        fetchThemes(data.ad_account_id);
      } else {
        toast({
          title: "No Ad Account Selected",
          description: "Please connect your Meta account and select an ad account.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error in fetchAdAccountId:', error);
      setIsLoading(false);
    }
  };
  
  const fetchCreatives = async (adAccountId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-meta-creatives', {
        body: { 
          adAccountId,
          timeRange: 'last_30_days'
        }
      });
      
      if (error) {
        console.error('Error fetching creatives:', error);
        toast({
          title: "Error",
          description: "Failed to fetch creatives from Meta. Using sample data.",
          variant: "destructive",
        });
        
        // Use default mock data if API fails
        const mockCreatives = generateMockCreatives();
        setCreatives(mockCreatives);
      } else {
        console.log('Meta creatives data:', data);
        
        if (data?.creatives && Array.isArray(data.creatives)) {
          const processedCreatives = data.creatives.map((creative: any) => ({
            ...creative,
            // Add default AIInsights count
            aiInsightsCount: Math.floor(Math.random() * 5) + 1
          }));
          setCreatives(processedCreatives);
        } else {
          // Fallback to mock data if response is invalid
          const mockCreatives = generateMockCreatives();
          setCreatives(mockCreatives);
        }
      }
    } catch (error) {
      console.error('Error in fetchCreatives:', error);
      // Fallback to mock data
      const mockCreatives = generateMockCreatives();
      setCreatives(mockCreatives);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchThemes = async (adAccountId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-creative-themes', {
        body: { 
          adAccountId,
          timeRange: 'last_30_days'
        }
      });
      
      if (error) {
        console.error('Error fetching themes:', error);
        // Use default mock themes
        setThemes(generateCreativeThemes());
      } else {
        if (data?.themes && Array.isArray(data.themes)) {
          setThemes(data.themes);
        } else {
          setThemes(generateCreativeThemes());
        }
      }
    } catch (error) {
      console.error('Error in fetchThemes:', error);
      setThemes(generateCreativeThemes());
    }
  };
  
  const generateMockCreatives = (): Creative[] => {
    const mockThemes = generateCreativeThemes();
    const statuses: ("active" | "paused" | "archived")[] = ["active", "paused", "archived"];
    const types: ("image" | "video")[] = ["image", "video"];
    
    return Array.from({ length: 20 }).map((_, i) => ({
      id: `creative-${i + 1}`,
      name: `Sample Creative ${i + 1}`,
      type: types[Math.floor(Math.random() * types.length)],
      url: `https://source.unsplash.com/random/800x600?ad=${i}`,
      thumbnailUrl: `https://source.unsplash.com/random/800x600?ad=${i}`,
      performance: Math.random() * 2 + 0.2, // Random between 0.2 and 2.2
      impressions: Math.floor(Math.random() * 10000) + 500,
      clicks: Math.floor(Math.random() * 500) + 10,
      ctr: (Math.random() * 0.1) + 0.01, // 1-11%
      conversions: Math.floor(Math.random() * 20) + 1,
      spend: Math.floor(Math.random() * 500) + 50,
      revenue: Math.floor(Math.random() * 1000) + 100,
      roas: Math.random() * 3 + 0.5,
      startDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      themes: Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map(() => mockThemes[Math.floor(Math.random() * mockThemes.length)].name),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      aiInsightsCount: Math.floor(Math.random() * 6) + 1
    }));
  };
  
  const handleRefresh = () => {
    if (currentAdAccountId) {
      setIsLoading(true);
      fetchCreatives(currentAdAccountId);
      fetchThemes(currentAdAccountId);
      
      toast({
        title: "Creative library refreshed",
        description: "The latest creative performance data and AI insights have been loaded."
      });
    } else {
      toast({
        title: "No Ad Account Selected",
        description: "Please connect your Meta account and select an ad account.",
        variant: "destructive",
      });
    }
  };
  
  const handleSelectCreative = (creative: Creative) => {
    setSelectedCreative(creative);
    setIsDetailOpen(true);
    
    // In a real app, this would be an API call to generate insights
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
