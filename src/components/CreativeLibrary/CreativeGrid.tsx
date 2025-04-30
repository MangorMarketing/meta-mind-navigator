
import { Creative } from "@/pages/CreativeLibrary";
import { CreativeCard } from "./CreativeCard";
import { Skeleton } from "@/components/ui/skeleton";

interface CreativeGridProps {
  creatives: Creative[];
  onSelect: (creative: Creative) => void;
  isLoading: boolean;
}

export function CreativeGrid({ creatives, onSelect, isLoading }: CreativeGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-lg border bg-card">
            <Skeleton className="aspect-video w-full" />
            <div className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <div className="flex gap-2 mb-3">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (creatives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border bg-card py-12 text-center">
        <h3 className="text-lg font-semibold">No creatives found</h3>
        <p className="text-muted-foreground">
          Try adjusting your filters or search term
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {creatives.map((creative) => (
        <CreativeCard 
          key={creative.id} 
          creative={creative} 
          onClick={() => onSelect(creative)}
        />
      ))}
    </div>
  );
}
