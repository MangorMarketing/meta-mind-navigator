
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  TooltipProps 
} from 'recharts';
import { DailyPerformance } from '@/utils/mockData';
import { Card } from '@/components/ui/card';

interface PerformanceChartProps {
  data: DailyPerformance[];
  title: string;
  className?: string;
}

export function PerformanceChart({ data, title, className }: PerformanceChartProps) {
  // Format date for x-axis
  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      return (
        <div className="bg-background p-3 border rounded-lg shadow-md">
          <p className="font-medium mb-1">{formattedDate}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => {
              let value = entry.value;
              let formattedValue;

              if (entry.name === 'roas') {
                formattedValue = (Number(value) || 0).toFixed(2);
              } else if (entry.name === 'spend' || entry.name === 'revenue') {
                formattedValue = `$${(Number(value) || 0).toLocaleString()}`;
              } else {
                formattedValue = (Number(value) || 0).toLocaleString();
              }

              return (
                <p key={`item-${index}`} className="text-sm flex items-center">
                  <span
                    className="inline-block w-3 h-3 mr-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="capitalize">{entry.name}</span>: <span className="font-medium ml-1">{formattedValue}</span>
                </p>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className={`p-4 ${className}`}>
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ strokeOpacity: 0.3 }}
            />
            <YAxis 
              yAxisId="left"
              orientation="left"
              tickFormatter={(value) => `$${value}`}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ strokeOpacity: 0.3 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => `${value.toFixed(2)}`}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ strokeOpacity: 0.3 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              yAxisId="left" 
              dataKey="spend" 
              fill="#D3E4FD" 
              name="Spend" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              yAxisId="left" 
              dataKey="revenue" 
              fill="#F2FCE2" 
              name="Revenue" 
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="roas"
              stroke="#9b87f5"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name="ROAS"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
