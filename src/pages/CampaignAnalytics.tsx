
import { AppLayout } from "@/components/Layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

// Mock data for campaign performance
const campaignPerformanceData = [
  { name: "Jan 1", spend: 4000, impressions: 240000, clicks: 9800, conversions: 480 },
  { name: "Jan 8", spend: 4200, impressions: 260000, clicks: 10400, conversions: 520 },
  { name: "Jan 15", spend: 3800, impressions: 230000, clicks: 9400, conversions: 470 },
  { name: "Jan 22", spend: 4100, impressions: 250000, clicks: 10000, conversions: 500 },
  { name: "Jan 29", spend: 4300, impressions: 265000, clicks: 10600, conversions: 530 },
  { name: "Feb 5", spend: 4600, impressions: 280000, clicks: 11200, conversions: 560 },
  { name: "Feb 12", spend: 5000, impressions: 300000, clicks: 12000, conversions: 600 },
];

// Mock data for campaign breakdown
const campaignBreakdownData = [
  { name: "Awareness", value: 40 },
  { name: "Consideration", value: 30 },
  { name: "Conversion", value: 20 },
  { name: "Retargeting", value: 10 },
];

// Mock data for platform performance
const platformPerformanceData = [
  { name: "Facebook", clicks: 6000, impressions: 150000, ctr: 4 },
  { name: "Instagram", clicks: 4000, impressions: 100000, ctr: 4 },
  { name: "Stories", clicks: 2000, impressions: 40000, ctr: 5 },
  { name: "Audience Network", clicks: 1000, impressions: 30000, ctr: 3.3 },
  { name: "Messenger", clicks: 500, impressions: 10000, ctr: 5 },
];

// Custom tooltip for campaign performance chart
const CampaignTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border p-3 shadow-sm rounded-md">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">
          <span className="inline-block w-3 h-3 mr-1 bg-primary rounded-full"></span>
          Spend: ${payload[0].value.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="inline-block w-3 h-3 mr-1 bg-green-500 rounded-full"></span>
          Impressions: {payload[1].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function CampaignAnalytics() {
  return (
    <AppLayout>
      <div className="page-transition">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Campaign Analytics</h1>
          <div className="flex items-center space-x-2">
            <Tabs defaultValue="7d" className="w-[300px]">
              <TabsList>
                <TabsTrigger value="7d">7d</TabsTrigger>
                <TabsTrigger value="30d">30d</TabsTrigger>
                <TabsTrigger value="90d">90d</TabsTrigger>
                <TabsTrigger value="12m">12m</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Ad Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$30,000</div>
              <div className="flex items-center text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>12% from last period</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Impressions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.8M</div>
              <div className="flex items-center text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>8% from last period</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg. CTR</CardTitle>
              <LineChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.2%</div>
              <div className="flex items-center text-sm text-red-600">
                <ArrowDownRight className="h-4 w-4 mr-1" />
                <span>2% from last period</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3,660</div>
              <div className="flex items-center text-sm text-green-600">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>10% from last period</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
              <CardDescription>Daily spend and impressions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={campaignPerformanceData}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip content={<CampaignTooltip />} />
                  <Area type="monotone" dataKey="spend" yAxisId="left" stroke="#8884d8" fillOpacity={1} fill="url(#colorSpend)" />
                  <Area type="monotone" dataKey="impressions" yAxisId="right" stroke="#82ca9d" fillOpacity={1} fill="url(#colorImpressions)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Campaign Breakdown</CardTitle>
              <CardDescription>Budget allocation by campaign type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={campaignBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {campaignBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658', '#ff8042'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </ResponsiveContainer>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Platform Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
            <CardDescription>Compare metrics across different platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={platformPerformanceData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="clicks" fill="#8884d8" name="Clicks" />
                <Bar dataKey="ctr" fill="#82ca9d" name="CTR %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
