
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface AIInsightsDisplayProps {
  insights: string;
  onNewAnalysis: () => void;
}

export function AIInsightsDisplay({ insights, onNewAnalysis }: AIInsightsDisplayProps) {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(insights);
    toast({
      title: "Copied to clipboard",
      description: "The insights have been copied to your clipboard.",
    });
  };

  const handleDownload = () => {
    const blob = new Blob([insights], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-insights-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>AI Generated Insights</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button variant="outline" size="sm" onClick={onNewAnalysis}>
            <RefreshCw className="h-4 w-4 mr-1" />
            New Analysis
          </Button>
        </div>
      </CardHeader>
      <CardContent className="prose max-w-none">
        <ReactMarkdown>{insights}</ReactMarkdown>
      </CardContent>
    </Card>
  );
}
