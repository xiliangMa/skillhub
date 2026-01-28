import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, GitFork, Download, DollarSign } from "lucide-react"

interface SkillCardProps {
  id: string
  name: string
  description: string
  stars: number
  forks: number
  downloads: number
  price: number
  priceType: string
}

export function SkillCard({
  id,
  name,
  description,
  stars,
  forks,
  downloads,
  price,
  priceType,
}: SkillCardProps) {
  return (
    <Link href={`/skills/${id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl">{name}</CardTitle>
            {priceType === "free" ? (
              <Badge variant="secondary">免费</Badge>
            ) : (
              <Badge className="bg-primary">
                <DollarSign className="h-3 w-3 mr-1" />
                {price}
              </Badge>
            )}
          </div>
          <CardDescription className="line-clamp-2">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                <span>{stars}</span>
              </div>
              <div className="flex items-center">
                <GitFork className="h-4 w-4 mr-1" />
                <span>{forks}</span>
              </div>
              <div className="flex items-center">
                <Download className="h-4 w-4 mr-1" />
                <span>{downloads}</span>
              </div>
            </div>
          </div>
          <Button className="w-full">
            {priceType === "free" ? "立即获取" : "购买"}
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
}
