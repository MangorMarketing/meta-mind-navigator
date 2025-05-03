
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { DashboardHeader } from "@/components/Dashboard/DashboardHeader";
import { StatCard } from "@/components/Dashboard/StatCard";
import { PerformanceChart } from "@/components/Dashboard/PerformanceChart";
import { ThemeExplorer } from "@/components/Dashboard/ThemeExplorer";
import { InsightsFeed } from "@/components/Dashboard/InsightsFeed";
import { CampaignsTable, MetaCampaign } from "@/components/Dashboard/CampaignsTable";
import { MetaConnect } from "@/components/Dashboard/MetaConnect";
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

// Define types for our Meta API response
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

interface MetaConnection {
  id: string;
  ad_account_id: string;
}

export default function Index() {
  // State for data and loading
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

  // State for Meta connection and ad accounts
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isMetaConnected, setIsMetaConnected] = useState(false);
  const [currentAdAccountId, setCurrentAdAccountId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (user) {
      checkMetaConnection();
    } else {
      setIsLoading(false);
    }
  }, [user]);
  
  const checkMetaConnection = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('meta_connections')
        .select('id, ad_account_id')
        .eq('user_id', user.id)
        .single();
        
      if (error) {
        console.error('Error checking Meta connection:', error);
        setIsMetaConnected(false);
        setIsLoading(false);
        return;
      }
      
      if (data) {
        setIsMetaConnected(true);
        setCurrentAdAccountId(data.ad_account_id);
        fetchMetaCampaigns(data.ad_account_id);
      } else {
        setIsMetaConnected(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error in checkMetaConnection:', error);
      setIsLoading(false);
    }
  };
  
  const fetchMetaCampaigns = async (adAccountId?: string) => {
    setIsLoading(true);
    setApiError(null);
    
    try {
      // Pass the specific adAccountId if provided
      const { data, error } = await supabase.functions.invoke('meta-campaigns', {
        body: adAccountId ? { adAccountId } : undefined
      });
      
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
        console.log('Fetched Meta data:', metaData);
        setCampaigns(metaData.campaigns);
        
        // Update key metrics from real data
        setKeyMetrics({
          totalSpend: metaData.insights.totalSpent,
          totalRevenue: metaData.insights.totalResults * 100, // Assuming $100 value per result
          roas: metaData.insights.averageROI / 100, // Convert from percentage to multiplier
          ctr: metaData.campaigns.reduce((sum, camp) => sum + (camp.ctr || 0), 0) / 
               (metaData.campaigns.length || 1), // Average CTR
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
  
  const handleAdAccountChange = async (adAccountId: string) => {
    setCurrentAdAccountId(adAccountId);
    
    // Update the user's default ad account in Supabase
    try {
      const { error } = await supabase.functions.invoke('update-ad-account', {
        body: { adAccountId }
      });
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to update ad account. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Fetch data for the new ad account
      fetchMetaCampaigns(adAccountId);
      
      toast({
        title: "Ad Account Updated",
        description: "Dashboard data updated for the selected ad account."
      });
    } catch (error) {
      console.error('Error updating ad account:', error);
      toast({
        title: "Error",
        description: "Failed to update ad account. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleRefreshData = () => {
    if (isMetaConnected) {
      fetchMetaCampaigns(currentAdAccountId || undefined);
    } else {
      toast({
        title: "Meta Account Not Connected",
        description: "Please connect your Meta account to fetch campaign data.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <AppLayout>
      <div className="page-transition">
        <DashboardHeader 
          title="Meta Ads Performance Dashboard" 
          onRefresh={handleRefreshData}
          currentAdAccountId={currentAdAccountId}
          onAdAccountChange={handleAdAccountChange}
        />
        
        {!isMetaConnected ? (
          <div className="mb-6">
            <MetaConnect />
          </div>
        ) : (
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
        )}
        
        {apiError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{apiError}</p>
            <p className="text-sm mt-1">
              {!isMetaConnected 
                ? "You need to connect your Meta account first." 
                : "Check your API credentials or try again later."}
            </p>
          </div>
        )}
        
        {isMetaConnected && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <PerformanceChart 
                data={dailyData} 
                title="Performance Over Time"
                className="lg:col-span-2"
              />
              <ThemeExplorer themes={creativeThemes} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <CampaignsTable 
                campaigns={campaigns} 
                className="lg:col-span-2" 
                isLoading={isLoading}
              />
              <InsightsFeed insights={aiInsights} />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
