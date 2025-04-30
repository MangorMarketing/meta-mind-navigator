
import { useState } from "react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CampaignPerformance } from "@/utils/mockData";
import { ArrowUpDown, MoreHorizontal, Search, Trash, Edit, Copy, TrendingUp } from "lucide-react";

interface CampaignsTableProps {
  campaigns: CampaignPerformance[];
  className?: string;
}

export function CampaignsTable({ campaigns, className }: CampaignsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof CampaignPerformance>("roas");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();
  
  // Filter campaigns by search query
  const filteredCampaigns = campaigns.filter((campaign) => 
    campaign.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort campaigns by selected field
  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
    
    // Default sorting for string values
    return sortDirection === "asc" 
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });
  
  // Handle sorting
  const handleSort = (field: keyof CampaignPerformance) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };
  
  // Format percentage values
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  // Handle action buttons
  const handleAction = (action: string, campaign: CampaignPerformance) => {
    switch (action) {
      case "edit":
        toast({
          title: "Edit Campaign",
          description: `Editing campaign: ${campaign.name}`
        });
        break;
      case "duplicate":
        toast({
          title: "Duplicate Campaign",
          description: `Duplicating campaign: ${campaign.name}`
        });
        break;
      case "delete":
        toast({
          title: "Delete Campaign",
          description: `Are you sure you want to delete: ${campaign.name}?`,
          variant: "destructive"
        });
        break;
      case "analyze":
        toast({
          title: "Analyzing Campaign",
          description: `Starting deep analysis of: ${campaign.name}`
        });
        break;
      default:
        break;
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand" />
          Campaign Performance
        </CardTitle>
        <CardDescription>View and manage your campaigns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="p-0 h-auto font-medium"
                    onClick={() => handleSort("spend")}
                  >
                    Spend
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="p-0 h-auto font-medium"
                    onClick={() => handleSort("revenue")}
                  >
                    Revenue
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button 
                    variant="ghost" 
                    className="p-0 h-auto font-medium"
                    onClick={() => handleSort("roas")}
                  >
                    ROAS
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <Button 
                    variant="ghost" 
                    className="p-0 h-auto font-medium"
                    onClick={() => handleSort("ctr")}
                  >
                    CTR
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  <Button 
                    variant="ghost" 
                    className="p-0 h-auto font-medium"
                    onClick={() => handleSort("conversions")}
                  >
                    Conversions
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCampaigns.length > 0 ? (
                sortedCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{formatCurrency(campaign.spend)}</TableCell>
                    <TableCell>{formatCurrency(campaign.revenue)}</TableCell>
                    <TableCell className={campaign.roas >= 1 ? "text-green-600" : "text-red-600"}>
                      {campaign.roas.toFixed(2)}x
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatPercentage(campaign.ctr)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {campaign.conversions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleAction("edit", campaign)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction("duplicate", campaign)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleAction("analyze", campaign)}>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Deep Analysis
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleAction("delete", campaign)}
                            className="text-red-600"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No campaigns found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
