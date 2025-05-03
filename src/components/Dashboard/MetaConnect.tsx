
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Facebook, LinkIcon, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

export function MetaConnect() {
  const { toast } = useToast();
  const { user } = useAuth();

  return (
    <Card className="shadow-lg border-blue-100">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
        <CardTitle className="flex items-center gap-2">
          <Facebook className="h-5 w-5 text-blue-600" />
          Meta Account Connection
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
            asChild
          >
            <Link to="/settings">
              <Facebook className="mr-2 h-4 w-4" />
              Go to Connection Settings
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
