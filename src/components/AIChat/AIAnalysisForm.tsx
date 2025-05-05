
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
import { Brain, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  dataType: z.string().min(1, "Please select a data type"),
  query: z.string().min(10, "Your query must be at least 10 characters"),
});

type FormValues = z.infer<typeof formSchema>;

interface AIAnalysisFormProps {
  onAnalysisComplete: (insights: string) => void;
  campaigns?: any[];
  creatives?: any[];
}

export function AIAnalysisForm({ onAnalysisComplete, campaigns, creatives }: AIAnalysisFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataType: "campaigns",
      query: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
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
        setIsLoading(false);
        return;
      }

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
      setIsLoading(false);
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="dataType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data to Analyze</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select data type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="campaigns">Campaign Performance</SelectItem>
                      <SelectItem value="creatives">Ad Creatives</SelectItem>
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
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full bg-brand hover:bg-brand-dark"
              disabled={isLoading}
            >
              {isLoading ? (
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
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Powered by OpenAI's GPT model
      </CardFooter>
    </Card>
  );
}
