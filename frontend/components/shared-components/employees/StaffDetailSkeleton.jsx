import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const StaffDetailSkeleton = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Info Skeleton */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="items-center text-center">
              <Skeleton className="h-24 w-24 rounded-full mb-4" />
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-5 w-20 mt-1" />
              <Skeleton className="h-5 w-28 mt-1" />
              <Skeleton className="h-6 w-20 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-px w-full" />
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-36" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-5 w-44" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Permissions Skeleton */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-40" />
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <div className="w-full">
                  <div className="flex bg-gray-50 p-2">
                    <div className="w-38 p-2"><Skeleton className="h-5 w-24" /></div>
                    <div className="flex-1 text-center p-2"><Skeleton className="h-5 w-20 mx-auto" /></div>
                    <div className="flex-1 text-center p-2"><Skeleton className="h-5 w-20 mx-auto" /></div>
                    <div className="flex-1 text-center p-2"><Skeleton className="h-5 w-20 mx-auto" /></div>
                    <div className="flex-1 text-center p-2"><Skeleton className="h-5 w-20 mx-auto" /></div>
                  </div>
                  <div className="divide-y">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex p-2 items-center">
                        <div className="w-38 p-2"><Skeleton className="h-5 w-20" /></div>
                        <div className="flex-1 text-center p-2"><Skeleton className="h-5 w-5 rounded-full mx-auto" /></div>
                        <div className="flex-1 text-center p-2"><Skeleton className="h-5 w-5 rounded-full mx-auto" /></div>
                        <div className="flex-1 text-center p-2"><Skeleton className="h-5 w-5 rounded-full mx-auto" /></div>
                        <div className="flex-1 text-center p-2"><Skeleton className="h-5 w-5 rounded-full mx-auto" /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StaffDetailSkeleton;
