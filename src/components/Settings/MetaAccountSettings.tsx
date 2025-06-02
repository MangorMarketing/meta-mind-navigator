
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

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export function MetaAccountSettings() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [currentAdAccountId, setCurrentAdAccountId] = useState<string | null>(null);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [fbLoaded, setFbLoaded] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchMetaConnectionStatus();
    }
  }, [user]);

  useEffect(() => {
    // Load Facebook SDK
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    window.fbAsyncInit = function() {
      window.FB.init({
        appId: '1261648262012907', // Your new App ID
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      setFbLoaded(true);
    };
  }, []);

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

    if (!fbLoaded || !window.FB) {
      toast({
        title: "Error",
        description: "Facebook SDK not loaded. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      // Use Facebook Login API directly
      window.FB.login((response: any) => {
        if (response.authResponse) {
          console.log('Facebook login successful:', response.authResponse);
          handleFacebookAuthResponse(response.authResponse);
        } else {
          console.log('User cancelled login or did not fully authorize.');
          toast({
            title: "Connection Cancelled",
            description: "Meta account connection was cancelled",
            variant: "destructive",
          });
          setIsConnecting(false);
        }
      }, {
        scope: 'ads_management,ads_read,business_management',
        return_scopes: true
      });
      
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

  const handleFacebookAuthResponse = async (authResponse: any) => {
    try {
      // Send the access token to our backend to complete the connection
      const { data, error } = await supabase.functions.invoke('complete-meta-connection-direct', {
        body: { 
          accessToken: authResponse.accessToken,
          userID: authResponse.userID,
          expiresIn: authResponse.expiresIn
        }
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || "Failed to complete Meta connection");
      }

      toast({
        title: "Connected Successfully",
        description: "Your Meta account has been connected",
      });
      
      await fetchMetaConnectionStatus();
      setIsConnecting(false);
      
    } catch (error) {
      console.error("Error completing Meta connection:", error);
      toast({
        title: "Connection Error",
        description: error instanceof Error ? error.message : "Failed to complete Meta connection",
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
          disabled={isConnecting || !fbLoaded}
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
        
        {!fbLoaded && (
          <p className="text-xs text-muted-foreground">Loading Facebook SDK...</p>
        )}
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
