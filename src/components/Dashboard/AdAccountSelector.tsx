
import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AdAccount {
  id: string;
  name: string;
}

interface AdAccountSelectorProps {
  currentAdAccountId: string | null;
  onAdAccountChange: (adAccountId: string) => void;
}

export function AdAccountSelector({ 
  currentAdAccountId,
  onAdAccountChange 
}: AdAccountSelectorProps) {
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdAccounts();
  }, []);

  const fetchAdAccounts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-ad-accounts');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.adAccounts && Array.isArray(data.adAccounts)) {
        setAdAccounts(data.adAccounts);
      } else {
        setAdAccounts([]);
      }
    } catch (error) {
      console.error("Error fetching ad accounts:", error);
      setError("Failed to load ad accounts. This might be due to Meta API rate limiting. Please try again in a few minutes.");
      toast({
        title: "Connection Issue",
        description: "Failed to load ad accounts from Meta. Please try again in a few minutes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectionChange = (adAccountId: string) => {
    if (adAccountId !== currentAdAccountId) {
      onAdAccountChange(adAccountId);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive" className="mb-2 py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Ad Account
          </Badge>
          
          <Select
            value={currentAdAccountId || ""}
            onValueChange={handleSelectionChange}
            disabled={isLoading || adAccounts.length === 0}
          >
            <SelectTrigger className="w-[260px] border-blue-200">
              <SelectValue placeholder={error ? "Unavailable" : "Select ad account"} />
            </SelectTrigger>
            <SelectContent align="start">
              {adAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 border-blue-200"
          onClick={fetchAdAccounts}
          disabled={isLoading}
          title="Refresh ad accounts"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    </div>
  );
}
