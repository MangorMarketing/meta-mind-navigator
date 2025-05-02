
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Facebook, LinkIcon, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MetaConnectProps {
  onSuccess?: () => void;
}

export function MetaConnect({ onSuccess }: MetaConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

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
            if (onSuccess) onSuccess();
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

  return (
    <Card className="shadow-lg border-blue-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
        <CardTitle className="flex items-center gap-2">
          <Facebook className="h-5 w-5 text-blue-600" />
          Connect Meta Account
        </CardTitle>
        <CardDescription>
          Connect your Meta Business account to access your ad campaigns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center space-y-4 p-4">
          <LinkIcon className="h-12 w-12 text-muted-foreground" />
          <p className="text-center text-sm text-muted-foreground">
            To see your campaign data, you need to connect your Meta Business account. 
            This will allow us to access your ad campaigns data.
          </p>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 w-full max-w-xs"
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
      </CardContent>
    </Card>
  );
}
