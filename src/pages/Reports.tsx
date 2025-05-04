import { useState } from "react";
import { AppLayout } from "@/components/Layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  metrics: string[];
  visualization: "table" | "chart" | "both";
}

const reportTemplates: ReportTemplate[] = [
  {
    id: "performance-overview",
    name: "Performance Overview",
    description: "A comprehensive overview of campaign performance metrics",
    metrics: ["spend", "impressions", "clicks", "conversions", "ROAS"],
    visualization: "both"
  },
  {
    id: "creative-analysis",
    name: "Creative Analysis",
    description: "Detailed analysis of creative performance and engagement",
    metrics: ["CTR", "CPC", "conversion_rate", "engagement_rate"],
    visualization: "chart"
  },
  {
    id: "audience-insights",
    name: "Audience Insights",
    description: "Demographic and behavioral insights about your audience",
    metrics: ["age", "gender", "location", "interests"],
    visualization: "chart"
  },
  {
    id: "budget-allocation",
    name: "Budget Allocation",
    description: "Analysis of budget distribution and efficiency",
    metrics: ["spend", "ROAS", "CPA", "budget_utilization"],
    visualization: "table"
  }
];

export default function Reports() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [reportName, setReportName] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });

  const handleCreateReport = () => {
    if (!selectedTemplate || !reportName) {
      toast.error("Please select a template and provide a report name");
      return;
    }

    // TODO: Implement report generation logic
    toast.success("Report created successfully!");
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Reports</h1>
          <Button onClick={handleCreateReport}>Create Report</Button>
        </div>

        <Tabs defaultValue="templates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="my-reports">My Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New Report</CardTitle>
                <CardDescription>Select a template and customize your report</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="report-name">Report Name</Label>
                  <Input
                    id="report-name"
                    placeholder="Enter report name"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template">Select Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                  />
                </div>

                {selectedTemplate && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {reportTemplates.find(t => t.id === selectedTemplate)?.name}
                      </CardTitle>
                      <CardDescription>
                        {reportTemplates.find(t => t.id === selectedTemplate)?.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label>Included Metrics:</Label>
                        <div className="flex flex-wrap gap-2">
                          {reportTemplates
                            .find(t => t.id === selectedTemplate)
                            ?.metrics.map((metric) => (
                              <span
                                key={metric}
                                className="px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                              >
                                {metric}
                              </span>
                            ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-reports">
            <Card>
              <CardHeader>
                <CardTitle>My Reports</CardTitle>
                <CardDescription>View and manage your saved reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  No reports created yet. Start by selecting a template above.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
} 