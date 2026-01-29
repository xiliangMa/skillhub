"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SkillCard } from "@/components/skill-card"
import { Search, TrendingUp, Zap, ArrowRight, Users, Database, Code2, Cpu, Activity, Download } from "lucide-react"
import { skillsApi, type Skill } from "@/lib/api"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useI18n } from "@/contexts/i18n-context"

export default function Home() {
  const { t } = useI18n()
  const [hotSkills, setHotSkills] = useState<Skill[]>([])
  const [trendingSkills, setTrendingSkills] = useState<Skill[]>([])
  const [stats, setStats] = useState({
    totalSkills: 0,
    totalDownloads: 0,
    activeUsers: 0,
    categories: 0
  })
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

        // Mock stats data
        setStats({
          totalSkills: 150,
          totalDownloads: 50000,
          activeUsers: 12000,
          categories: 8
        })
      } catch (error) {
        console.error('Failed to fetch skills:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
      {/* Animated background grid */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/50 to-transparent" />
      </div>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 px-4 md:px-6 overflow-hidden">
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 right-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-cyan-200/30 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Tech badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-400/30 bg-blue-100/50 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm text-blue-700 font-mono">AI SKILLS MARKETPLACE v2.0</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-700 to-blue-500 bg-clip-text text-transparent">
              {t.home.heroTitle}
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto">
              {t.home.heroSubtitle}
            </p>

            {/* Search bar with tech glow */}
            <div className="max-w-2xl mx-auto w-full">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg blur opacity-40 group-hover:opacity-60 transition duration-500" />
                <div className="relative flex items-center bg-white/90 backdrop-blur-md rounded-lg border border-slate-200">
                  <Search className="absolute left-4 h-5 w-5 text-slate-400" />
                  <Input
                    type="search"
                    placeholder={t.home.searchPlaceholder}
                    className="h-14 pl-12 pr-4 text-lg bg-transparent border-0 focus-visible:ring-0 text-slate-900 placeholder:text-slate-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        window.location.href = `/skills?search=${encodeURIComponent(e.currentTarget.value)}`
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/skills">
                <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base font-semibold text-white">
                  {t.home.startBrowsing}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/categories">
                <Button variant="outline" size="lg" className="h-14 px-8 border-slate-300 bg-white hover:bg-slate-50 text-base text-slate-700">
                  {t.home.learnMore}
                </Button>
              </Link>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12">
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-3xl md:text-4xl font-bold text-blue-600">
                  <Database className="h-6 w-6 md:h-8 md:w-8" />
                  {stats.totalSkills}+
                </div>
                <div className="text-sm text-slate-500 font-mono">AI SKILLS</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-3xl md:text-4xl font-bold text-purple-600">
                  <Download className="h-6 w-6 md:h-8 md:w-8" />
                  {stats.totalDownloads.toLocaleString()}+
                </div>
                <div className="text-sm text-slate-500 font-mono">DOWNLOADS</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-3xl md:text-4xl font-bold text-cyan-600">
                  <Users className="h-6 w-6 md:h-8 md:w-8" />
                  {stats.activeUsers.toLocaleString()}+
                </div>
                <div className="text-sm text-slate-500 font-mono">ACTIVE USERS</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-3xl md:text-4xl font-bold text-green-600">
                  <Cpu className="h-6 w-6 md:h-8 md:w-8" />
                  {stats.categories}+
                </div>
                <div className="text-sm text-slate-500 font-mono">CATEGORIES</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features with glassmorphism */}
      <section className="relative py-20 px-4 md:px-6">
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">{t.home.whyChooseUs}</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Powered by cutting-edge AI technology</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: t.features.quickIntegration.title,
                description: t.features.quickIntegration.description,
                color: "from-yellow-200/50 to-orange-200/50",
                iconColor: "text-yellow-600"
              },
              {
                icon: TrendingUp,
                title: t.features.continuousUpdates.title,
                description: t.features.continuousUpdates.description,
                color: "from-blue-200/50 to-purple-200/50",
                iconColor: "text-blue-600"
              },
              {
                icon: Code2,
                title: t.features.richCategories.title,
                description: t.features.richCategories.description,
                color: "from-cyan-200/50 to-green-200/50",
                iconColor: "text-cyan-600"
              }
            ].map((feature, index) => (
              <div key={index} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r opacity-30 group-hover:opacity-50 rounded-xl blur transition duration-500" />
                <div className="relative h-full bg-gradient-to-br from-white/90 to-blue-50/90 backdrop-blur-sm p-8 rounded-xl border border-slate-200 group-hover:border-blue-300 transition-all">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-slate-200 mb-6">
                    <feature.icon className={`h-8 w-8 ${feature.iconColor}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hot Skills */}
      <section className="relative py-20 px-4 md:px-6 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="container mx-auto relative z-10">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">{t.home.hotSkills}</h2>
              <div className="flex items-center gap-2 text-slate-600">
                <Activity className="h-5 w-5 text-red-500" />
                <span className="font-mono">Most downloaded skills</span>
              </div>
            </div>
            <Link href="/skills">
              <Button variant="outline" size="lg" className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700">
                {t.home.learnMore}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 bg-slate-200/50 animate-pulse rounded-xl border border-slate-200" />
              ))}
            </div>
          ) : hotSkills.length === 0 ? (
            <div className="text-center py-16 bg-slate-100/50 rounded-xl border border-slate-200">
              <Database className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">{t.home.noHotSkills}</p>
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
      <section className="relative py-20 px-4 md:px-6">
        <div className="container mx-auto relative z-10">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">{t.home.trendingSkills}</h2>
              <div className="flex items-center gap-2 text-slate-600">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="font-mono">Fastest growing this week</span>
              </div>
            </div>
            <Link href="/skills">
              <Button variant="outline" size="lg" className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700">
                {t.home.learnMore}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-80 bg-slate-200/50 animate-pulse rounded-xl border border-slate-200" />
              ))}
            </div>
          ) : trendingSkills.length === 0 ? (
            <div className="text-center py-16 bg-slate-100/50 rounded-xl border border-slate-200">
              <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">{t.home.noTrendingSkills}</p>
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

      {/* CTA Section */}
      <section className="relative py-20 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 via-purple-100/50 to-cyan-100/50" />
        <div className="container mx-auto relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Ready to Supercharge Your AI?</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Join thousands of developers building the next generation of AI applications
          </p>
          <Link href="/skills">
            <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base font-semibold text-white">
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
