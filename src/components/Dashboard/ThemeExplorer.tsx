
import { BarChart, Activity, Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreativeTheme } from "@/utils/mockData";
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

interface ThemeExplorerProps {
  themes: CreativeTheme[];
  className?: string;
}

export function ThemeExplorer({ themes, className }: ThemeExplorerProps) {
  // Sort themes by performance
  const sortedThemes = [...themes].sort((a, b) => b.performance - a.performance);
  const topTheme = sortedThemes[0];

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
      </CardContent>
    </Card>
  );
}
