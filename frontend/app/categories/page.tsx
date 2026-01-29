"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { skillsApi } from "@/lib/api"
import Link from "next/link"
import { useI18n } from "@/contexts/i18n-context"
import { Database, TrendingUp, Zap, Shield, Globe, Code, ArrowRight } from "lucide-react"

export default function CategoriesPage() {
  const { t } = useI18n()
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await skillsApi.getCategories()
        setCategories(response.data || [])
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const categoryIcons: Record<string, any> = {
    'Tools': Zap,
    'Development': Code,
    'Data & AI': Database,
    'Business': TrendingUp,
    'Security': Shield,
    'Integration': Globe,
  }

  const categoryColors: Record<string, string> = {
    'Tools': 'from-blue-500 to-blue-600',
    'Development': 'from-purple-500 to-purple-600',
    'Data & AI': 'from-cyan-500 to-cyan-600',
    'Business': 'from-green-500 to-green-600',
    'Security': 'from-red-500 to-red-600',
    'Integration': 'from-orange-500 to-orange-600',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
      {/* Header Section */}
      <section className="relative py-20 px-4 md:px-6 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-700 to-blue-500 bg-clip-text text-transparent">
              {t.categories?.title || 'Explore Categories'}
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              {t.categories?.subtitle || 'Discover AI skills organized by category to find the perfect solution for your needs'}
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.length > 0 ? (
            categories.map((category) => {
              const IconComponent = categoryIcons[category.name] || Database
              const gradientColor = categoryColors[category.name] || 'from-blue-500 to-blue-600'

              return (
                <Link key={category.id} href={`/skills?category=${category.id}`}>
                  <Card className="h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-slate-200 bg-white cursor-pointer">
                    <CardHeader>
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradientColor} flex items-center justify-center mb-4`}>
                        <IconComponent className="h-7 w-7 text-white" />
                      </div>
                      <CardTitle className="text-2xl text-slate-900">{category.name}</CardTitle>
                      <CardDescription className="text-base">
                        {category.children?.length || 0} subcategories
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
                        <span>Explore skills</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })
          ) : (
            // Default categories if no data
            [
              { name: 'Tools', children: [{}, {}, {}] },
              { name: 'Development', children: [{}, {}, {}] },
              { name: 'Data & AI', children: [{}, {}, {}] },
              { name: 'Business', children: [{}, {}] },
              { name: 'Security', children: [{}] },
              { name: 'Integration', children: [{}, {}] },
            ].map((category, index) => {
              const IconComponent = categoryIcons[category.name] || Database
              const gradientColor = categoryColors[category.name] || 'from-blue-500 to-blue-600'

              return (
                <Link key={index} href={`/skills?category=${category.name}`}>
                  <Card className="h-full transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-slate-200 bg-white cursor-pointer">
                    <CardHeader>
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradientColor} flex items-center justify-center mb-4`}>
                        <IconComponent className="h-7 w-7 text-white" />
                      </div>
                      <CardTitle className="text-2xl text-slate-900">{category.name}</CardTitle>
                      <CardDescription className="text-base">
                        {category.children?.length || 0} subcategories
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
                        <span>Explore skills</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 md:px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8 bg-white/50 backdrop-blur-sm rounded-2xl p-12 border border-slate-200">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
            Ready to Find the Perfect Skill?
          </h2>
          <p className="text-xl text-slate-600">
            Browse our extensive collection of AI skills and find exactly what you need
          </p>
          <Link href="/skills">
            <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base font-semibold text-white">
              Browse All Skills
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
