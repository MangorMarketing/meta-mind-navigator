
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
  generateDailyData,
  generateCreativeThemes,
  generateAIInsights,
  generateCampaigns,
  generateKeyMetrics
} from "@/utils/mockData";

export default function Index() {
  const [dailyData, setDailyData] = useState(() => generateDailyData());
  const [creativeThemes, setCreativeThemes] = useState(() => generateCreativeThemes());
  const [aiInsights, setAIInsights] = useState(() => generateAIInsights());
  const [campaigns, setCampaigns] = useState(() => generateCampaigns());
  const [keyMetrics, setKeyMetrics] = useState(() => generateKeyMetrics());
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleRefreshData = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      setDailyData(generateDailyData());
      setCampaigns(generateCampaigns());
      setKeyMetrics(generateKeyMetrics());
      setIsLoading(false);
    }, 1000);
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
