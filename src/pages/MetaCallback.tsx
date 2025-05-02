
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function MetaCallback() {
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get("code");
      const state = params.get("state");
      const error = params.get("error");
      const errorDescription = params.get("error_description");

      if (error) {
        // Send error message back to opener window
        window.opener?.postMessage({
          type: "META_AUTH_CALLBACK",
          error: errorDescription || "Failed to authenticate with Meta",
        }, window.origin);
        return;
      }

      if (!code || !state) {
        window.opener?.postMessage({
          type: "META_AUTH_CALLBACK",
          error: "Invalid callback parameters",
        }, window.origin);
        return;
      }

      try {
        // Exchange the code for an access token
        const { data, error } = await supabase.functions.invoke('complete-meta-connection', { 
          body: { code, state, redirectUri: window.location.origin + "/meta-callback" } 
        });

        if (error || !data?.success) {
          throw new Error(error?.message || data?.error || "Failed to complete Meta connection");
        }

        // Notify the opener window about the successful connection
        window.opener?.postMessage({
          type: "META_AUTH_CALLBACK",
          success: true
        }, window.origin);
      } catch (error) {
        console.error("Error completing Meta connection:", error);
        window.opener?.postMessage({
          type: "META_AUTH_CALLBACK",
          error: error instanceof Error ? error.message : "Failed to complete Meta connection",
        }, window.origin);
      }
    };

    if (window.opener) {
      handleCallback();
    }
  }, [location.search]);

  return (
    <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Connecting Meta Account</h1>
      <p className="text-muted-foreground">
        Please wait while we complete your Meta account connection...
      </p>
      <div className="mt-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
      </div>
    </div>
  );
}
