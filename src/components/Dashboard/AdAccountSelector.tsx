
import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const { toast } = useToast();

  useEffect(() => {
    fetchAdAccounts();
  }, []);

  const fetchAdAccounts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-ad-accounts');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.adAccounts && Array.isArray(data.adAccounts)) {
        setAdAccounts(data.adAccounts);
      }
    } catch (error) {
      console.error("Error fetching ad accounts:", error);
      toast({
        title: "Error",
        description: "Failed to load ad accounts. Please try again.",
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
            <SelectValue placeholder="Select ad account" />
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
  );
}
