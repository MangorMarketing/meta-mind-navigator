
import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { cn } from "@/lib/utils";

export interface BenchmarkMetric {
  name: string;
  value: number;
  benchmark: number;
  unit: string;
  isHigherBetter: boolean;
}

interface PerformanceBenchmarkChartProps {
  metrics: BenchmarkMetric[];
}

export function PerformanceBenchmarkChart({ metrics }: PerformanceBenchmarkChartProps) {
  // Format the data for the chart
  const data = metrics.map((metric) => {
    const performance = (metric.value / metric.benchmark);
    const isGood = metric.isHigherBetter 
      ? performance >= 1 
      : performance <= 1;
    
    return {
      name: metric.name,
      value: metric.value,
      benchmark: metric.benchmark,
      performance,
      isGood,
      unit: metric.unit,
      isHigherBetter: metric.isHigherBetter,
      fill: isGood ? "#22C55E" : "#EF4444",
    };
  });

  return (
    <div className="w-full rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h3 className="font-medium">Performance vs Benchmarks</h3>
          <div className="flex items-center text-sm gap-2">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
              <span>Above benchmark</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
              <span>Below benchmark</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="h-80">
        <ChartContainer
          config={{
            metric: { color: "#F1F1F1" },
            benchmark: { color: "#94A3B8" },
          }}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 50, left: 120, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis 
              type="number" 
              domain={[0, 'dataMax']} 
              tickFormatter={(value) => `${value}${data[0]?.unit || ''}`}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={110}
            />
            <ReferenceLine x={1} stroke="#94A3B8" strokeDasharray="3 3" />
            <ChartTooltip
              content={(props: any) => {
                const { active, payload } = props;
                if (!active || !payload || !payload.length) return null;
                
                const data = payload[0].payload;
                return (
                  <ChartTooltipContent
                    className="flex flex-col gap-2 !min-w-[180px]"
                    {...props}
                  >
                    <div className="text-sm font-medium">{data.name}</div>
                    <div className="grid grid-cols-2 gap-y-1 text-xs">
                      <div className="text-muted-foreground">Current</div>
                      <div className="font-medium text-right">
                        {data.value}{data.unit}
                      </div>
                      
                      <div className="text-muted-foreground">Benchmark</div>
                      <div className="font-medium text-right">
                        {data.benchmark}{data.unit}
                      </div>
                      
                      <div className="text-muted-foreground">Performance</div>
                      <div className={cn(
                        "font-medium text-right",
                        data.isGood ? "text-green-600" : "text-red-600"
                      )}>
                        {data.performance.toFixed(2)}x
                      </div>
                    </div>
                  </ChartTooltipContent>
                );
              }}
            />
            <Bar
              dataKey="value"
              fill="currentColor"
              className="fill-primary"
              radius={[0, 4, 4, 0]}
            >
              <LabelList 
                dataKey="value" 
                position="right"
                formatter={(value: number, entry: any) => {
                  // Handle the case where entry might be undefined
                  if (!entry || typeof entry !== 'object') return value;
                  
                  // Safely access the unit property
                  const unit = entry.unit || '';
                  return `${value}${unit}`;
                }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
