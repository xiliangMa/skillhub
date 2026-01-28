import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SkillCardSkeleton } from "@/components/skill-card-skeleton"
import { Search, TrendingUp, Zap, ArrowRight, Folder } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted/20 py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl font-bold tracking-tight">
              Discover and Purchase AI Skills
            </h1>
            <p className="text-xl text-muted-foreground">
              The best AI assistant skills marketplace for your applications
            </p>

            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search skills..."
                  className="h-12 pl-10 text-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-center space-x-4 pt-4">
              <Button size="lg">
                Start Browsing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Quick Integration</h3>
              <p className="text-sm text-muted-foreground">
                Plug and play, deploy instantly to your applications
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Continuous Updates</h3>
              <p className="text-sm text-muted-foreground">
                Regular updates to keep up with the latest technology
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                <Folder className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">Rich Categories</h3>
              <p className="text-sm text-muted-foreground">
                Covering various AI skills to meet different needs
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hot Skills */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Hot Skills</h2>
            <Button variant="outline">View All</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkillCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Trending Skills */}
      <section className="py-16 bg-muted/20">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Trending Skills</h2>
            <Button variant="outline">View All</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkillCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
