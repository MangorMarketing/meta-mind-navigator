import { useEffect, useState } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { DashboardHeader, DateRange } from "@/components/Dashboard/DashboardHeader";
import { StatCard } from "@/components/Dashboard/StatCard";
import { PerformanceChart } from "@/components/Dashboard/PerformanceChart";
import { ThemeExplorer } from "@/components/Dashboard/ThemeExplorer";
import { InsightsFeed } from "@/components/Dashboard/InsightsFeed";
import { CampaignsTable, MetaCampaign } from "@/components/Dashboard/CampaignsTable";
import { MetaConnect } from "@/components/Dashboard/MetaConnect";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 
import { AlertCircle } from "lucide-react";
import { 
  DollarSign, 
  TrendingUp, 
  BarChart4, 
  MousePointer, 
  ShoppingCart,
  Target
} from "lucide-react";
import {
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
  totalRevenue: number;
  averageCPA: number;
  averageROI: number;
}

interface MetaApiResponse {
  campaigns: MetaCampaign[];
  insights: MetaInsights;
  dailyData?: DailyPerformance[];
}

interface MetaConnection {
  id: string;
  ad_account_id: string;
}

export default function Index() {
  // State for data and loading
  const [dailyData, setDailyData] = useState<DailyPerformance[]>([]);
  const [creativeThemes, setCreativeThemes] = useState([]);
  const [aiInsights, setAIInsights] = useState(() => generateAIInsights());
  const [campaigns, setCampaigns] = useState<MetaCampaign[]>([]);
  const [keyMetrics, setKeyMetrics] = useState({
    totalSpend: 0,
    totalRevenue: 0,
    roas: 0,
    ctr: 0,
    conversions: 0,
    costPerAction: 0
  });
  const [dateRange, setDateRange] = useState<DateRange>("last_30_days");

  // State for Meta connection and ad accounts
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isMetaConnected, setIsMetaConnected] = useState(false);
  const [currentAdAccountId, setCurrentAdAccountId] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retryTimeoutId, setRetryTimeoutId] = useState<number | null>(null);
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
        fetchMetaCampaigns(data.ad_account_id, dateRange);
      } else {
        setIsMetaConnected(false);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error in checkMetaConnection:', error);
      setIsLoading(false);
    }
  };
  
  const fetchMetaCampaigns = async (adAccountId?: string, timeRange: DateRange = "last_30_days") => {
    setIsLoading(true);
    setApiError(null);
    
    try {
      // Pass the specific adAccountId and timeRange
      const { data, error } = await supabase.functions.invoke('meta-campaigns', {
        body: { 
          adAccountId: adAccountId || undefined,
          timeRange: timeRange
        }
      });
      
      if (error) {
        console.error('Error fetching Meta campaigns:', error);
        setApiError('Failed to fetch campaign data');
        toast({
          title: "Error",
          description: "Failed to fetch campaign data. Please try again.",
          variant: "destructive",
        });
        
        // Schedule a retry if this was an API rate limiting issue
        if (error.message?.includes('rate limit') || error.status === 429) {
          scheduleRetry(adAccountId, timeRange);
        }
        
        setIsLoading(false);
        return;
      }
      
      if (data) {
        // Clear any retry timeouts since we got data successfully
        if (retryTimeoutId) {
          clearTimeout(retryTimeoutId);
          setRetryTimeoutId(null);
          setRetryAttempt(0);
        }
        
        const metaData = data as MetaApiResponse;
        console.log('Fetched Meta data:', metaData);
        
        // Update campaign data
        setCampaigns(metaData.campaigns || []);
        
        // Update key metrics from real data
        setKeyMetrics({
          totalSpend: metaData.insights.totalSpent || 0,
          totalRevenue: metaData.insights.totalRevenue || 0, 
          roas: metaData.insights.averageROI || 0, 
          ctr: metaData.campaigns.reduce((sum, camp) => sum + (camp.ctr || 0), 0) / 
               (metaData.campaigns.length || 1) || 0, // Average CTR
          conversions: metaData.insights.totalResults || 0,
          costPerAction: metaData.insights.averageCPA || 0
        });
        
        // Update daily performance data if available
        if (metaData.dailyData && metaData.dailyData.length > 0) {
          setDailyData(metaData.dailyData);
        } else {
          // Fallback to generated data if not available
          setDailyData(generateDailyData());
        }
        
        // Fetch creative themes
        fetchCreativeThemes(adAccountId, timeRange);
        
        // Generate dynamic AI insights based on the data
        generateAIInsightsFromData(metaData);
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
  
  const fetchCreativeThemes = async (adAccountId?: string, timeRange: DateRange = "last_30_days") => {
    try {
      const { data, error } = await supabase.functions.invoke('fetch-creative-themes', {
        body: { 
          adAccountId: adAccountId || undefined,
          timeRange: timeRange
        }
      });
      
      if (error) {
        console.error('Error fetching creative themes:', error);
        return;
      }
      
      if (data && data.themes) {
        setCreativeThemes(data.themes);
      }
    } catch (error) {
      console.error('Error in fetchCreativeThemes:', error);
    }
  };
  
  const generateAIInsightsFromData = (metaData: MetaApiResponse) => {
    // Keep the existing AI insights but potentially we could generate these based on real data
    // For now we'll just use the mock data
    setAIInsights(generateAIInsights());
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
      
      // Fetch data for the new ad account with current date range
      fetchMetaCampaigns(adAccountId, dateRange);
      
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
  
  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    
    if (isMetaConnected && currentAdAccountId) {
      fetchMetaCampaigns(currentAdAccountId, range);
    }
  };
  
  const handleRefreshData = () => {
    // Reset retry attempts on manual refresh
    setRetryAttempt(0);
    if (retryTimeoutId) {
      clearTimeout(retryTimeoutId);
      setRetryTimeoutId(null);
    }
    
    if (isMetaConnected) {
      fetchMetaCampaigns(currentAdAccountId || undefined, dateRange);
    } else {
      toast({
        title: "Meta Account Not Connected",
        description: "Please connect your Meta account to fetch campaign data.",
        variant: "destructive",
      });
    }
  };
  
  // Add a function to schedule retries with exponential backoff
  const scheduleRetry = (adAccountId?: string, timeRange?: DateRange) => {
    // Clear any existing timeout
    if (retryTimeoutId) {
      clearTimeout(retryTimeoutId);
    }
    
    // Calculate backoff time (in seconds): 5s, 15s, 30s, 60s, 120s max
    const delayInSeconds = Math.min(5 * Math.pow(2, retryAttempt), 120);
    
    console.log(`Scheduling retry attempt ${retryAttempt + 1} in ${delayInSeconds} seconds`);
    
    const timeoutId = setTimeout(() => {
      console.log(`Executing retry attempt ${retryAttempt + 1}`);
      fetchMetaCampaigns(adAccountId, timeRange);
      setRetryAttempt(prev => prev + 1);
    }, delayInSeconds * 1000) as unknown as number;
    
    setRetryTimeoutId(timeoutId);
  };
  
  return (
    <AppLayout>
      <div className="page-transition">
        <DashboardHeader 
          title="Meta Ads Performance Dashboard" 
          onRefresh={handleRefreshData}
          currentAdAccountId={currentAdAccountId}
          onAdAccountChange={handleAdAccountChange}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
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
              title="Cost per Action"
              value={keyMetrics.costPerAction}
              format="currency"
              trend={-1.8}
              invertTrend={true}
              icon={<Target className="h-4 w-4" />}
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
          <Alert variant="destructive" className="bg-red-50 mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription>
              <p>{apiError}</p>
              <p className="text-sm mt-1">
                {retryAttempt > 0 ? (
                  `Automatic retry attempt ${retryAttempt} scheduled. This could be due to Meta API rate limiting.`
                ) : (
                  !isMetaConnected 
                    ? "You need to connect your Meta account first." 
                    : "This could be due to Meta API rate limiting. Please try again later."
                )}
              </p>
            </AlertDescription>
          </Alert>
        )}
        
        {isMetaConnected && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <PerformanceChart 
                data={dailyData} 
                title="Performance Over Time"
                className="lg:col-span-2"
              />
              <ThemeExplorer 
                themes={creativeThemes} 
                adAccountId={currentAdAccountId}
                dateRange={dateRange}
              />
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
