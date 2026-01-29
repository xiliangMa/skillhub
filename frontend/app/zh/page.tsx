"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SkillCard } from "@/components/skill-card"
import { Search, TrendingUp, Zap, ArrowRight, Folder } from "lucide-react"
import { skillsApi, type Skill } from "@/lib/api"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useI18n } from "@/contexts/i18n-context"

export default function ZhPage() {
  const { t } = useI18n()
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50/50 to-white py-16 md:py-24 px-4 md:px-6">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
              {t.home.heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-slate-600">
              {t.home.heroSubtitle}
            </p>

            <div className="max-w-xl mx-auto w-full">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  type="search"
                  placeholder={t.home.searchPlaceholder}
                  className="h-12 pl-10 text-lg bg-white border-slate-200"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      window.location.href = `/zh/skills?search=${encodeURIComponent(e.currentTarget.value)}`
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/zh/skills">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  {t.home.startBrowsing}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/categories">
                <Button variant="outline" size="lg" className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700">
                  {t.home.learnMore}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 md:px-6 bg-slate-50/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-slate-900">{t.home.whyChooseUs}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 text-blue-600">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{t.features.quickIntegration.title}</h3>
              <p className="text-sm text-slate-600">
                {t.features.quickIntegration.description}
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 text-purple-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{t.features.continuousUpdates.title}</h3>
              <p className="text-sm text-slate-600">
                {t.features.continuousUpdates.description}
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-100 text-cyan-600">
                <Folder className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{t.features.richCategories.title}</h3>
              <p className="text-sm text-slate-600">
                {t.features.richCategories.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hot Skills */}
      <section className="py-16 px-4 md:px-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-slate-900">{t.home.hotSkills}</h2>
            <Link href="/zh/skills">
              <Button variant="outline" size="sm" className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700">{t.home.learnMore}</Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-200/50 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : hotSkills.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              {t.home.noHotSkills}
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
      <section className="py-16 px-4 md:px-6 bg-slate-50/50">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-slate-900">{t.home.trendingSkills}</h2>
            <Link href="/zh/skills">
              <Button variant="outline" size="sm" className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700">{t.home.learnMore}</Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-200/50 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : trendingSkills.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              {t.home.noTrendingSkills}
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
