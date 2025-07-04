
import { useState } from "react";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Brain, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  dataType: z.string().min(1, "Please select a data type"),
  query: z.string().min(10, "Your query must be at least 10 characters"),
});

type FormValues = z.infer<typeof formSchema>;

interface AIAnalysisFormProps {
  onAnalysisComplete: (insights: string) => void;
  campaigns?: any[];
  creatives?: any[];
  isLoading?: boolean;
}

export function AIAnalysisForm({ 
  onAnalysisComplete, 
  campaigns = [], 
  creatives = [], 
  isLoading = false 
}: AIAnalysisFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataType: "campaigns",
      query: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Determine which data to send based on data type
      const dataPoints = values.dataType === "campaigns" 
        ? campaigns 
        : values.dataType === "creatives" 
          ? creatives 
          : [];
      
      if (!dataPoints || dataPoints.length === 0) {
        toast({
          title: "No data available",
          description: `No ${values.dataType} data is available for analysis.`,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      console.log(`Sending ${dataPoints.length} ${values.dataType} for analysis`);

      // Make a request to our edge function
      const { data, error } = await supabase.functions.invoke("analyze-with-ai", {
        body: {
          dataType: values.dataType,
          dataPoints,
          query: values.query,
        },
      });

      if (error) {
        console.error("Error analyzing data:", error);
        toast({
          title: "Analysis Failed",
          description: "Failed to analyze the data. Please try again later.",
          variant: "destructive",
        });
        return;
      }

      if (data && data.insights) {
        onAnalysisComplete(data.insights);
      } else {
        toast({
          title: "No Insights Generated",
          description: "The AI couldn't generate insights from the provided data.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in AI analysis:", error);
      toast({
        title: "Analysis Error",
        description: "An unexpected error occurred during analysis.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasNoCampaigns = campaigns.length === 0;
  const hasNoCreatives = creatives.length === 0;
  const hasNoData = hasNoCampaigns && hasNoCreatives;
  
  const getDataCountText = (dataType: string) => {
    if (dataType === "campaigns") {
      return hasNoCampaigns ? "No campaigns available" : `${campaigns.length} campaigns available`;
    } else {
      return hasNoCreatives ? "No creatives available" : `${creatives.length} creatives available`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-brand" />
          AI Analysis Assistant
        </CardTitle>
        <CardDescription>
          Ask our AI to analyze your campaign or creative data
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
            <span className="ml-2">Loading your data...</span>
          </div>
        ) : hasNoData ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No data available</AlertTitle>
            <AlertDescription>
              No campaigns or creatives found to analyze. Please make sure your Meta account is connected and you have data to analyze.
            </AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="dataType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data to Analyze</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Show toast with data count
                        toast({
                          title: getDataCountText(value),
                          description: value === "campaigns" 
                            ? (hasNoCampaigns ? "Connect your Meta account to load campaign data." : "Ready for analysis.") 
                            : (hasNoCreatives ? "Connect your Meta account to load creative data." : "Ready for analysis."),
                        });
                      }} 
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select data type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="campaigns" disabled={hasNoCampaigns}>
                          Campaign Performance {hasNoCampaigns ? "(No data)" : `(${campaigns.length})`}
                        </SelectItem>
                        <SelectItem value="creatives" disabled={hasNoCreatives}>
                          Ad Creatives {hasNoCreatives ? "(No data)" : `(${creatives.length})`}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Analysis Request</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., What patterns do you see in my best performing campaigns? Or, Which creative elements are most effective?"
                        className="min-h-[100px]"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-brand hover:bg-brand-dark"
                disabled={isSubmitting || hasNoData}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>Analyze with AI</>
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Powered by OpenAI's GPT model
      </CardFooter>
    </Card>
  );
}
