import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const TimelineSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Filter buttons skeleton */}
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-9 w-20" />
        ))}
      </div>

      {/* Event cards skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {/* Icon skeleton */}
                <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                
                <div className="flex-1 space-y-2">
                  {/* Title and time */}
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  
                  {/* Description */}
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  
                  {/* Metadata */}
                  <div className="flex gap-2 mt-3">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
