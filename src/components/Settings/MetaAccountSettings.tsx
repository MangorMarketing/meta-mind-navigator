
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Facebook, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface AdAccount {
  id: string;
  name: string;
}

export function MetaAccountSettings() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [currentAdAccountId, setCurrentAdAccountId] = useState<string | null>(null);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchMetaConnectionStatus();
    }
  }, [user]);

  const fetchMetaConnectionStatus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('meta_connections')
        .select('id, ad_account_id, connected_at')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setIsConnected(true);
        if (data.ad_account_id) {
          setCurrentAdAccountId(data.ad_account_id);
        }
        await fetchAvailableAdAccounts();
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error("Error fetching Meta connection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableAdAccounts = async () => {
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
        description: "Failed to fetch ad accounts. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConnectMeta = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to connect your Meta account",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      // Initiate Meta connection process
      const { data, error } = await supabase.functions.invoke('init-meta-connection');
      
      if (error || !data?.authUrl) {
        throw new Error(error?.message || "Failed to initialize Meta connection");
      }

      // Open Facebook login window in a popup
      const authWindow = window.open(
        data.authUrl,
        "Meta Authentication",
        "width=600,height=700"
      );
      
      // Check for popup blockers
      if (!authWindow || authWindow.closed) {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups for this site to connect your Meta account",
          variant: "destructive",
        });
        setIsConnecting(false);
        return;
      }

      // Set up message listener for the callback
      const messageHandler = async (event: MessageEvent) => {
        // Verify message origin for security
        if (event.data?.type === "META_AUTH_CALLBACK") {
          // Clean up the listener
          window.removeEventListener("message", messageHandler);
          
          // Close the popup
          if (authWindow && !authWindow.closed) {
            authWindow.close();
          }
          
          if (event.data?.error) {
            toast({
              title: "Connection Failed",
              description: event.data.error,
              variant: "destructive",
            });
          } else if (event.data?.success) {
            toast({
              title: "Connected Successfully",
              description: "Your Meta account has been connected",
            });
            await fetchMetaConnectionStatus();
          }
          
          setIsConnecting(false);
        }
      };
      
      window.addEventListener("message", messageHandler);
      
    } catch (error) {
      console.error("Meta connection error:", error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect Meta account",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleAdAccountChange = async (accountId: string) => {
    try {
      const { error } = await supabase.functions.invoke('update-ad-account', {
        body: { adAccountId: accountId }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setCurrentAdAccountId(accountId);
      
      toast({
        title: "Ad Account Updated",
        description: "Your selected ad account has been updated.",
      });
    } catch (error) {
      console.error("Error updating ad account:", error);
      toast({
        title: "Error",
        description: "Failed to update ad account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnectMeta = async () => {
    try {
      const { error } = await supabase.functions.invoke('disconnect-meta-account');
      
      if (error) {
        throw new Error(error.message);
      }
      
      setIsConnected(false);
      setAdAccounts([]);
      setCurrentAdAccountId(null);
      
      toast({
        title: "Account Disconnected",
        description: "Your Meta account has been disconnected",
      });
    } catch (error) {
      console.error("Error disconnecting Meta account:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect Meta account. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <Facebook className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="font-medium">Meta Business</h3>
            <p className="text-sm text-muted-foreground">Connect your Meta Business account to access ad campaigns</p>
          </div>
        </div>
        
        <Button
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          onClick={handleConnectMeta}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Facebook className="mr-2 h-4 w-4" />
              Connect Meta Account
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <Facebook className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="font-medium">Meta Business</h3>
            <p className="text-sm text-green-600">Connected</p>
          </div>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect Meta Account</AlertDialogTitle>
              <AlertDialogDescription>
                This will disconnect your Meta Business account. You'll need to reconnect to access your ad campaigns.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 hover:bg-red-700" 
                onClick={handleDisconnectMeta}
              >
                Disconnect
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Ad Account</label>
        <div className="flex items-center space-x-2">
          <Select 
            value={currentAdAccountId || ""}
            onValueChange={handleAdAccountChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an ad account" />
            </SelectTrigger>
            <SelectContent>
              {adAccounts.length > 0 ? (
                adAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No ad accounts available</SelectItem>
              )}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={fetchAvailableAdAccounts}
            title="Refresh ad accounts"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
