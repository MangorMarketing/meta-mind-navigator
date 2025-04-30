
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { BenchmarkMetric } from "./PerformanceBenchmarkChart";

interface BenchmarkComparisonProps {
  metrics: BenchmarkMetric[];
  comparisonTitle: string;
}

export function BenchmarkComparison({ metrics, comparisonTitle }: BenchmarkComparisonProps) {
  // Format helpers
  const formatValue = (metric: BenchmarkMetric) => {
    if (metric.unit === "%") {
      return `${(metric.value * 100).toFixed(2)}%`;
    } else if (metric.unit === "$") {
      return `$${metric.value.toFixed(2)}`;
    } else {
      return `${metric.value}${metric.unit}`;
    }
  };
  
  const formatBenchmark = (metric: BenchmarkMetric) => {
    if (metric.unit === "%") {
      return `${(metric.benchmark * 100).toFixed(2)}%`;
    } else if (metric.unit === "$") {
      return `$${metric.benchmark.toFixed(2)}`;
    } else {
      return `${metric.benchmark}${metric.unit}`;
    }
  };
  
  const getPerformance = (metric: BenchmarkMetric) => {
    const performance = metric.value / metric.benchmark;
    return performance.toFixed(2);
  };
  
  const getDifference = (metric: BenchmarkMetric) => {
    const diff = metric.value - metric.benchmark;
    const formattedDiff = metric.unit === "%" 
      ? `${(diff * 100).toFixed(2)}%` 
      : metric.unit === "$"
        ? `$${diff.toFixed(2)}`
        : `${diff.toFixed(2)}${metric.unit}`;
    
    return {
      value: formattedDiff,
      isPositive: (metric.isHigherBetter && diff > 0) || (!metric.isHigherBetter && diff < 0)
    };
  };
  
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium">{comparisonTitle}</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Metric</TableHead>
            <TableHead className="text-right">Your Creative</TableHead>
            <TableHead className="text-right">Benchmark</TableHead>
            <TableHead className="text-right">Performance</TableHead>
            <TableHead className="text-right">Difference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((metric, i) => {
            const diff = getDifference(metric);
            return (
              <TableRow key={`${metric.name}-${i}`}>
                <TableCell className="font-medium">{metric.name}</TableCell>
                <TableCell className="text-right">{formatValue(metric)}</TableCell>
                <TableCell className="text-right">{formatBenchmark(metric)}</TableCell>
                <TableCell className="text-right">
                  <div className={cn(
                    "flex items-center justify-end gap-1 font-medium",
                    diff.isPositive ? "text-green-600" : "text-red-600"
                  )}>
                    {parseFloat(getPerformance(metric)) === 1 ? (
                      <Minus className="h-4 w-4" />
                    ) : diff.isPositive ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>{getPerformance(metric)}x</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className={cn(
                    "font-medium",
                    diff.isPositive ? "text-green-600" : "text-red-600"
                  )}>
                    {diff.value}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
