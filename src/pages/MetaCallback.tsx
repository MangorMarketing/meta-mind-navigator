
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

      console.log("Meta callback received:", { code: !!code, state: !!state, error, errorDescription });

      if (error) {
        console.error("Meta OAuth error:", error, errorDescription);
        // Send error message back to opener window
        if (window.opener) {
          window.opener.postMessage({
            type: "META_AUTH_CALLBACK",
            error: errorDescription || error || "Failed to authenticate with Meta",
          }, window.origin);
          window.close();
        } else {
          // If no opener, redirect to settings with error
          window.location.href = "/settings?error=" + encodeURIComponent(errorDescription || error);
        }
        return;
      }

      if (!code || !state) {
        console.error("Missing callback parameters:", { code: !!code, state: !!state });
        const errorMsg = "Invalid callback parameters";
        if (window.opener) {
          window.opener.postMessage({
            type: "META_AUTH_CALLBACK",
            error: errorMsg,
          }, window.origin);
          window.close();
        } else {
          window.location.href = "/settings?error=" + encodeURIComponent(errorMsg);
        }
        return;
      }

      try {
        console.log("Attempting to complete Meta connection...");
        // Exchange the code for an access token
        const { data, error } = await supabase.functions.invoke('complete-meta-connection', { 
          body: { code, state, redirectUri: window.location.origin + "/meta-callback" } 
        });

        if (error || !data?.success) {
          throw new Error(error?.message || data?.error || "Failed to complete Meta connection");
        }

        console.log("Meta connection completed successfully");
        
        // Notify the opener window about the successful connection
        if (window.opener) {
          window.opener.postMessage({
            type: "META_AUTH_CALLBACK",
            success: true
          }, window.origin);
          window.close();
        } else {
          // If no opener, redirect to settings with success
          window.location.href = "/settings?success=meta_connected";
        }
      } catch (error) {
        console.error("Error completing Meta connection:", error);
        const errorMsg = error instanceof Error ? error.message : "Failed to complete Meta connection";
        
        if (window.opener) {
          window.opener.postMessage({
            type: "META_AUTH_CALLBACK",
            error: errorMsg,
          }, window.origin);
          window.close();
        } else {
          window.location.href = "/settings?error=" + encodeURIComponent(errorMsg);
        }
      }
    };

    if (window.opener || location.search.includes('code=')) {
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
