
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { AIAnalysisForm } from "@/components/AIChat/AIAnalysisForm";
import { AIInsightsDisplay } from "@/components/AIChat/AIInsightsDisplay";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { AlertCircle, Brain, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

export default function AIChat() {
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [creatives, setCreatives] = useState<any[]>([]);
  const [currentAdAccountId, setCurrentAdAccountId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setApiError(null);
    
    try {
      // Fetch ad account first to use in subsequent requests
      const adAccountResponse = await supabase.functions.invoke("fetch-ad-accounts", {
        body: {}
      });
      
      if (adAccountResponse.error) {
        console.error("Error fetching ad accounts:", adAccountResponse.error);
        setApiError("Failed to load account data for analysis");
        setIsLoading(false);
        return;
      }
      
      if (!adAccountResponse.data?.adAccounts || adAccountResponse.data.adAccounts.length === 0) {
        console.log("No ad accounts found");
        setApiError("No Meta ad accounts connected");
        setIsLoading(false);
        return;
      }
      
      const adAccountId = adAccountResponse.data.adAccounts[0].id;
      console.log("Using ad account:", adAccountId);
      setCurrentAdAccountId(adAccountId);
      
      // Fetch campaigns with the ad account ID
      const campaignsResult = await supabase.functions.invoke("meta-campaigns", {
        body: { adAccountId }
      });
      
      if (campaignsResult.error) {
        console.error("Error fetching campaigns:", campaignsResult.error);
        // Continue execution even if campaigns fetch fails
      } else if (campaignsResult.data && campaignsResult.data.campaigns) {
        console.log("Fetched campaigns:", campaignsResult.data.campaigns);
        setCampaigns(campaignsResult.data.campaigns);
      } else {
        console.log("No campaign data returned");
        setCampaigns([]);
      }
      
      // Fetch creatives with the ad account ID
      const creativesResult = await supabase.functions.invoke("fetch-meta-creatives", {
        body: { adAccountId, timeRange: 'last_30_days' }
      });
      
      if (creativesResult.error) {
        console.error("Error fetching creatives:", creativesResult.error);
        // Continue execution even if creatives fetch fails
      } else if (creativesResult.data && creativesResult.data.creatives) {
        console.log("Fetched creatives for AI analysis:", creativesResult.data.creatives.length);
        setCreatives(creativesResult.data.creatives);
      } else {
        console.log("No creative data returned");
        setCreatives([]);
      }
      
    } catch (error) {
      console.error("Error fetching data:", error);
      setApiError("Failed to load data for analysis");
      toast({
        title: "Error Loading Data",
        description: "Failed to load campaign and creative data for analysis.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysisComplete = (generatedInsights: string) => {
    setInsights(generatedInsights);
  };

  const handleNewAnalysis = () => {
    setInsights(null);
  };

  const handleRefresh = () => {
    fetchData();
  };

  // Check if we have data after loading is complete
  const hasData = !isLoading && (campaigns.length > 0 || creatives.length > 0);

  return (
    <AppLayout>
      <div className="page-transition">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Analysis</h1>
            <p className="text-muted-foreground">
              Use AI to analyze your campaigns and creatives
            </p>
          </div>
          <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>Refresh Data</>
            )}
          </Button>
        </div>

        {apiError && !hasData && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {!insights ? (
            <div className="md:col-span-6 lg:col-span-5">
              <AIAnalysisForm 
                onAnalysisComplete={handleAnalysisComplete}
                campaigns={campaigns}
                creatives={creatives}
                isLoading={isLoading}
                adAccountId={currentAdAccountId}
              />
            </div>
          ) : (
            <div className="md:col-span-12">
              <AIInsightsDisplay 
                insights={insights} 
                onNewAnalysis={handleNewAnalysis} 
              />
            </div>
          )}
          
          {!insights && (
            <div className="md:col-span-6 lg:col-span-7">
              <Alert className="bg-brand/5 border-brand">
                <Brain className="h-4 w-4 text-brand" />
                <AlertTitle>AI Analysis Assistant</AlertTitle>
                <AlertDescription className="space-y-4">
                  <p>
                    Our AI assistant can analyze your campaign and creative data to provide insights, 
                    identify patterns, and suggest optimization opportunities.
                  </p>
                  <h4 className="font-semibold">Example questions you can ask:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Which campaigns have the highest ROI and why?</li>
                    <li>Identify patterns in my best performing creatives</li>
                    <li>What ad elements seem to drive the most conversions?</li>
                    <li>How can I optimize my budget allocation?</li>
                    <li>Suggest ways to improve my underperforming campaigns</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
        
        {isLoading && (
          <div className="flex justify-center items-center mt-8">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <span className="ml-2">Loading data for analysis...</span>
          </div>
        )}
        
        {!isLoading && !hasData && !apiError && (
          <Alert variant="destructive" className="mt-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No data available</AlertTitle>
            <AlertDescription>
              <p>No campaigns or creatives data is available for analysis.</p>
              <p className="text-sm mt-2">
                Make sure you have connected your Meta account and have at least one campaign or creative to analyze.
              </p>
              <Button className="mt-4" variant="outline" onClick={handleRefresh}>
                Refresh Data
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </AppLayout>
  );
}
