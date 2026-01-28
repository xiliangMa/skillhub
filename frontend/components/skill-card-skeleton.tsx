import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SkillCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-2/3 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  )
}
