import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, GitFork, Download, DollarSign, Cpu, Zap } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"

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
  const { t } = useI18n()

  return (
    <Link href={`/skills/${id}`}>
      <div className="group relative h-full">
        {/* Glow effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />

        {/* Card */}
        <div className="relative h-full bg-gradient-to-br from-white to-blue-50/90 backdrop-blur-sm rounded-xl border border-slate-200 group-hover:border-blue-300 transition-all overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/50 to-transparent rounded-full blur-xl" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-purple-100/50 to-transparent rounded-full blur-xl" />

          <CardHeader className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-50 to-white border border-slate-200 flex items-center justify-center">
                  <Cpu className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl text-slate-900 font-semibold group-hover:text-blue-700 transition-colors">
                  {name}
                </CardTitle>
              </div>
              {priceType === "free" ? (
                <Badge className="bg-green-100/50 text-green-700 border-green-300 hover:bg-green-100">
                  {t.home.free}
                </Badge>
              ) : (
                <Badge className="bg-gradient-to-r from-blue-100/50 to-purple-100/50 text-blue-700 border-blue-300 hover:from-blue-100 hover:to-purple-100">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {price}
                </Badge>
              )}
            </div>
            <CardDescription className="text-slate-600 line-clamp-2">
              {description}
            </CardDescription>
          </CardHeader>

          <CardContent className="relative">
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-yellow-600">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-semibold">{stars}</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">STARS</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-purple-600">
                  <GitFork className="h-4 w-4" />
                  <span className="font-semibold">{forks}</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">FORKS</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-600">
                  <Download className="h-4 w-4" />
                  <span className="font-semibold">{downloads}</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">DOWNLOADS</div>
              </div>
            </div>

            {/* CTA button */}
            <Button
              className={`w-full h-11 font-semibold transition-all ${
                priceType === "free"
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              }`}
            >
              {priceType === "free" ? (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  {t.home.getStart}
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  {t.home.buy}
                </>
              )}
            </Button>
          </CardContent>
        </div>
      </div>
    </Link>
  )
}
