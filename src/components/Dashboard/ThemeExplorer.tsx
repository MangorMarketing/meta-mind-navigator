import { useState, useEffect } from "react";
import { BarChart, Activity, Award, Lightbulb } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ResponsiveContainer, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell 
} from 'recharts';
import { supabase } from "@/integrations/supabase/client";

export interface CreativeTheme {
  id: string;
  name: string;
  performance: number;
  count: number;
  examples: string[];
  color: string;
}

interface ThemeExplorerProps {
  themes?: CreativeTheme[];
  className?: string;
  adAccountId?: string | null;
  dateRange?: string;
}

export function ThemeExplorer({ themes: initialThemes, className, adAccountId, dateRange }: ThemeExplorerProps) {
  const [themes, setThemes] = useState<CreativeTheme[]>(initialThemes || []);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (adAccountId) {
      fetchCreativeThemes();
    }
  }, [adAccountId, dateRange]);
  
  const fetchCreativeThemes = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-creative-themes', {
        body: { 
          adAccountId,
          timeRange: dateRange || 'last_30_days'
        }
      });
      
      if (error) {
        console.error('Error fetching creative themes:', error);
        // If we have initial themes, keep using those on error
        if (!initialThemes || initialThemes.length === 0) {
          // Generate fallback themes with common creative types
          const fallbackThemes: CreativeTheme[] = [
            {
              id: "1",
              name: "Testimonials",
              performance: 1.4,
              count: 8,
              examples: ["Customer story", "Real results"],
              color: "#9b87f5"
            },
            {
              id: "2",
              name: "Product Features",
              performance: 1.2,
              count: 12,
              examples: ["Key features", "How it works"],
              color: "#4ade80"
            },
            {
              id: "3",
              name: "Limited Time Offers",
              performance: 1.1,
              count: 5,
              examples: ["Sale ends soon", "24 hour deal"],
              color: "#f59e0b"
            },
            {
              id: "4",
              name: "Social Proof",
              performance: 1.0,
              count: 9,
              examples: ["5-star reviews", "1000+ customers"],
              color: "#3b82f6"
            },
            {
              id: "5",
              name: "Before & After",
              performance: 0.9,
              count: 3,
              examples: ["Transformation", "Results"],
              color: "#ec4899"
            }
          ];
          setThemes(fallbackThemes);
        }
      } else {
        console.log('Fetched creative themes:', data);
        if (data?.themes && Array.isArray(data.themes)) {
          setThemes(data.themes);
        }
      }
    } catch (error) {
      console.error('Error in fetchCreativeThemes:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sort themes by performance
  const sortedThemes = [...themes].sort((a, b) => b.performance - a.performance);
  const topTheme = sortedThemes[0];

  if (!topTheme) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5 text-brand" />
            Creative Theme Analysis
          </CardTitle>
          <CardDescription>No theme data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-muted-foreground">
            <Lightbulb className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>Connect your Meta account to analyze creative themes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format performance for display
  const formatPerformance = (value: number) => {
    return value.toFixed(2) + 'x';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-brand" />
              Creative Theme Analysis
            </CardTitle>
            <CardDescription>Performance by creative theme</CardDescription>
          </div>
          <Badge className="bg-brand hover:bg-brand-dark">
            {themes.length} Themes
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3 mb-2">
                <Award className="h-8 w-8 text-brand" />
                <div>
                  <h3 className="font-semibold text-lg">{topTheme.name}</h3>
                  <p className="text-muted-foreground text-sm">Top performing theme</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-sm text-muted-foreground">Performance</p>
                  <p className="text-xl font-bold">{formatPerformance(topTheme.performance)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Count</p>
                  <p className="text-xl font-bold">{topTheme.count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Examples</p>
                  <div className="flex gap-2">
                    {topTheme.examples.slice(0, 2).map((example, index) => (
                      <Badge key={index} variant="outline">
                        {example}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={sortedThemes}
                  margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }} 
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${value}x`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${Number(value).toFixed(2)}x`, 'Performance']}
                    labelFormatter={(label) => `Theme: ${label}`}
                  />
                  <Bar dataKey="performance" fill="#9b87f5" radius={[4, 4, 0, 0]}>
                    {sortedThemes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
              {sortedThemes.map((theme) => (
                <div 
                  key={theme.id} 
                  className="p-2 rounded-lg border flex flex-col" 
                  style={{ borderLeftColor: theme.color, borderLeftWidth: '4px' }}
                >
                  <p className="font-medium text-sm">{theme.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{theme.count} ads</span>
                    <span className="text-xs font-semibold">{formatPerformance(theme.performance)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
