"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SkillCard } from "@/components/skill-card"
import { Search, TrendingUp, Zap, ArrowRight, Folder } from "lucide-react"
import { skillsApi, type Skill } from "@/lib/api"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function Home() {
  const [hotSkills, setHotSkills] = useState<Skill[]>([])
  const [trendingSkills, setTrendingSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hot, trending] = await Promise.all([
          skillsApi.getHot(4),
          skillsApi.getTrending(4),
        ])
        setHotSkills(hot.data || [])
        setTrendingSkills(trending.data || [])
      } catch (error) {
        console.error('Failed to fetch skills:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted/20 py-16 md:py-24 px-4 md:px-6">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Discover and Purchase AI Skills
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              The best AI assistant skills marketplace for your applications
            </p>

            <div className="max-w-xl mx-auto w-full">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="搜索技能..."
                  className="h-12 pl-10 text-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      window.location.href = `/skills?search=${encodeURIComponent(e.currentTarget.value)}`
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/skills">
                <Button size="lg">
                  Start Browsing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/categories">
                <Button variant="outline" size="lg">
                  Explore Categories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 md:px-6 bg-muted/20">
        <div className="container mx-auto">
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
                Regular updates to keep up with latest technology
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
      <section className="py-16 px-4 md:px-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Hot Skills</h2>
            <Link href="/skills">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : hotSkills.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hot skills available yet
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {hotSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  id={skill.id}
                  name={skill.name}
                  description={skill.description}
                  stars={skill.stars_count}
                  forks={skill.forks_count}
                  downloads={skill.downloads_count}
                  price={skill.price}
                  priceType={skill.price_type}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trending Skills */}
      <section className="py-16 px-4 md:px-6 bg-muted/20">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Trending Skills</h2>
            <Link href="/skills">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : trendingSkills.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No trending skills available yet
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {trendingSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  id={skill.id}
                  name={skill.name}
                  description={skill.description}
                  stars={skill.stars_count}
                  forks={skill.forks_count}
                  downloads={skill.downloads_count}
                  price={skill.price}
                  priceType={skill.price_type}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
