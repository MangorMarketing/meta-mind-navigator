
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Search, Filter, X } from "lucide-react";
import { CreativeTheme } from "@/utils/mockData";

interface FiltersState {
  search: string;
  type: string;
  theme: string;
  status: string;
  performanceMin: number;
}

interface CreativeFiltersProps {
  filters: FiltersState;
  onFilterChange: (filters: Partial<FiltersState>) => void;
  themes: CreativeTheme[];
}

export function CreativeFilters({ filters, onFilterChange, themes }: CreativeFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const resetFilters = () => {
    onFilterChange({
      search: "",
      type: "",
      theme: "",
      status: "",
      performanceMin: 0
    });
  };
  
  const activeFilterCount = Object.values(filters).filter(
    value => value !== "" && value !== 0
  ).length;
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search creatives..."
              className="pl-8"
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
            />
            {filters.search && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-7 w-7 p-0"
                onClick={() => onFilterChange({ search: "" })}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={isExpanded ? "default" : "outline"}
            size="sm"
            className="gap-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 rounded-full bg-primary/20 px-1.5 text-xs font-medium">
                {activeFilterCount}
              </span>
            )}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort by
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>Newest first</DropdownMenuItem>
                <DropdownMenuItem>Oldest first</DropdownMenuItem>
                <DropdownMenuItem>Best performing</DropdownMenuItem>
                <DropdownMenuItem>Worst performing</DropdownMenuItem>
                <DropdownMenuItem>Highest spend</DropdownMenuItem>
                <DropdownMenuItem>Name (A-Z)</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {isExpanded && (
        <div className="grid grid-cols-1 gap-4 rounded-lg border bg-background p-4 md:grid-cols-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <Select 
              value={filters.type} 
              onValueChange={(value) => onFilterChange({ type: value })}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="theme">Theme</Label>
            <Select 
              value={filters.theme} 
              onValueChange={(value) => onFilterChange({ theme: value })}
            >
              <SelectTrigger id="theme">
                <SelectValue placeholder="All themes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All themes</SelectItem>
                {themes.map((theme) => (
                  <SelectItem key={theme.id} value={theme.name}>
                    {theme.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={filters.status} 
              onValueChange={(value) => onFilterChange({ status: value })}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <div className="flex items-center justify-between">
              <Label>Performance (min)</Label>
              <span className="text-sm text-muted-foreground">
                {filters.performanceMin.toFixed(1)}x
              </span>
            </div>
            <Slider
              value={[filters.performanceMin]}
              min={0}
              max={3}
              step={0.1}
              onValueChange={(value) => onFilterChange({ performanceMin: value[0] })}
              className="py-4"
            />
          </div>
          
          <div className="flex justify-end md:col-span-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters}
              className="gap-1"
            >
              <X className="h-4 w-4" />
              Reset filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
