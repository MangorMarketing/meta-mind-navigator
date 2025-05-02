
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { DashboardHeader } from "@/components/Dashboard/DashboardHeader";
import { StatCard } from "@/components/Dashboard/StatCard";
import { PerformanceChart } from "@/components/Dashboard/PerformanceChart";
import { ThemeExplorer } from "@/components/Dashboard/ThemeExplorer";
import { InsightsFeed } from "@/components/Dashboard/InsightsFeed";
import { CampaignsTable } from "@/components/Dashboard/CampaignsTable";
import { 
  DollarSign, 
  TrendingUp, 
  BarChart4, 
  MousePointer, 
  ShoppingCart 
} from "lucide-react";
import {
  generateCreativeThemes,
  generateAIInsights,
  generateDailyData,
  DailyPerformance
} from "@/utils/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Define types for our Meta API responses
interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  budget: number;
  spent: number;
  results: number;
  cpa: number;
  roi: number;
  objective?: string;
  ctr?: number;
  impressions?: number;
  reach?: number;
  clicks?: number;
}

interface MetaInsights {
  totalSpent: number;
  totalResults: number;
  averageCPA: number;
  averageROI: number;
}

interface MetaApiResponse {
  campaigns: MetaCampaign[];
  insights: MetaInsights;
}

export default function Index() {
  const [dailyData, setDailyData] = useState<DailyPerformance[]>(() => generateDailyData());
  const [creativeThemes, setCreativeThemes] = useState(() => generateCreativeThemes());
  const [aiInsights, setAIInsights] = useState(() => generateAIInsights());
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [keyMetrics, setKeyMetrics] = useState({
    totalSpend: 0,
    totalRevenue: 0,
    roas: 0,
    ctr: 0,
    conversions: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const fetchMetaCampaigns = async () => {
    setIsLoading(true);
    setApiError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('meta-campaigns');
      
      if (error) {
        console.error('Error fetching Meta campaigns:', error);
        setApiError('Failed to fetch campaign data');
        toast({
          title: "Error",
          description: "Failed to fetch campaign data. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      if (data) {
        const metaData = data as MetaApiResponse;
        setCampaigns(metaData.campaigns);
        
        // Update key metrics from real data
        setKeyMetrics({
          totalSpend: metaData.insights.totalSpent,
          totalRevenue: metaData.insights.totalResults * 100, // Assuming $100 value per result
          roas: metaData.insights.averageROI / 100, // Convert from percentage to multiplier
          ctr: metaData.campaigns.reduce((sum, camp) => sum + (camp.ctr || 0), 0) / metaData.campaigns.length, // Average CTR
          conversions: metaData.insights.totalResults
        });
      }
    } catch (error) {
      console.error('Error in fetchMetaCampaigns:', error);
      setApiError('Failed to process campaign data');
      toast({
        title: "Error",
        description: "Failed to process campaign data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchMetaCampaigns();
    } else {
      setIsLoading(false);
    }
  }, [user]);
  
  const handleRefreshData = () => {
    fetchMetaCampaigns();
  };
  
  return (
    <AppLayout>
      <div className="page-transition">
        <DashboardHeader title="Meta Ads Performance Dashboard" onRefresh={handleRefreshData} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            title="Total Spend"
            value={keyMetrics.totalSpend}
            format="currency"
            trend={8.2}
            icon={<DollarSign className="h-4 w-4" />}
          />
          
          <StatCard
            title="Total Revenue"
            value={keyMetrics.totalRevenue}
            format="currency"
            trend={12.5}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          
          <StatCard
            title="ROAS"
            value={keyMetrics.roas}
            trend={4.3}
            icon={<BarChart4 className="h-4 w-4" />}
          />
          
          <StatCard
            title="CTR"
            value={keyMetrics.ctr}
            format="percentage"
            trend={-1.8}
            invertTrend={true}
            icon={<MousePointer className="h-4 w-4" />}
          />
          
          <StatCard
            title="Conversions"
            value={keyMetrics.conversions}
            trend={5.7}
            icon={<ShoppingCart className="h-4 w-4" />}
          />
        </div>
        
        {apiError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{apiError}</p>
            <p className="text-sm mt-1">
              You may need to connect your Meta account first or check your API credentials.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <PerformanceChart 
            data={dailyData} 
            title="Performance Over Time"
            className="lg:col-span-2"
          />
          <ThemeExplorer themes={creativeThemes} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <CampaignsTable campaigns={campaigns} className="lg:col-span-2" />
          <InsightsFeed insights={aiInsights} />
        </div>
      </div>
    </AppLayout>
  );
}
