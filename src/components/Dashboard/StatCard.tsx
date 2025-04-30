
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  format?: "currency" | "percentage" | "number";
  invertTrend?: boolean;
}

export function StatCard({
  title,
  value,
  trend,
  trendLabel,
  icon,
  className,
  format = "number",
  invertTrend = false,
}: StatCardProps) {
  const formattedValue = (() => {
    if (format === "currency") {
      return typeof value === "number"
        ? `$${value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : value;
    }
    if (format === "percentage") {
      return typeof value === "number"
        ? `${(value * 100).toFixed(2)}%`
        : value;
    }
    if (format === "number" && typeof value === "number") {
      return value.toLocaleString("en-US");
    }
    return value;
  })();

  const isTrendPositive = trend !== undefined ? trend > 0 : undefined;
  const showTrend = trend !== undefined;
  
  // Invert the trend color if invertTrend is true
  const trendIsGood = invertTrend ? !isTrendPositive : isTrendPositive;

  return (
    <div className={cn("stat-card", className)}>
      <div className="flex items-center justify-between">
        <p className="stat-label">{title}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="stat-value">{formattedValue}</div>
      {showTrend && (
        <div
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            trendIsGood ? "text-green-600" : "text-red-600"
          )}
        >
          {isTrendPositive ? (
            <ArrowUpIcon className="h-3 w-3" />
          ) : (
            <ArrowDownIcon className="h-3 w-3" />
          )}
          <span>
            {Math.abs(trend).toFixed(1)}% {trendLabel || "vs previous period"}
          </span>
        </div>
      )}
    </div>
  );
}
