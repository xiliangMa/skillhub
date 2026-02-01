"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SkillCard } from "@/components/skill-card"
import { Search, Filter } from "lucide-react"
import { skillsApi, categoriesApi, type Skill, type Category } from "@/lib/api"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useI18n } from "@/contexts/i18n-context"

export const dynamic = "force-dynamic"
export const runtime = 'edge'

export default function SkillsPage() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  
  const [skills, setSkills] = useState<Skill[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(searchQuery)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 12

  useEffect(() => {
    fetchCategories()
    fetchSkills()
  }, [page, selectedCategory])

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll()
      setCategories(response.data || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchSkills = async () => {
    setLoading(true)
    try {
      const params: any = {
        page,
        page_size: pageSize,
      }
      if (selectedCategory) {
        params.category_id = selectedCategory
      }
      if (searchTerm) {
        params.search = searchTerm
      }

      const response = await skillsApi.getList(params)
      setSkills(response.list || [])
      setTotal(response.total || 0)
    } catch (error) {
      console.error('Failed to fetch skills:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchSkills()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{t.home.heroTitle}</h1>
              <p className="text-sm text-slate-600 mt-1">
                {t.home.heroSubtitle}
              </p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder={t.nav.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-300 bg-white"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Categories */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4 text-slate-700" />
                <h2 className="font-semibold text-slate-900">{t.home.filterCategory}</h2>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    setSelectedCategory(null)
                    setPage(1)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedCategory === null
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {t.home.allCategories}
                </button>

                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id)
                      setPage(1)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Skills Grid */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {t.home.findSkills.replace('{count}', String(total))}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(pageSize)].map((_, i) => (
                  <div
                    key={i}
                    className="h-64 bg-slate-200/50 animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : skills.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-600">{t.home.skillNotFound}</p>
                <Button
                  variant="outline"
                  className="mt-4 border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                  onClick={() => {
                    setSelectedCategory(null)
                    setSearchTerm("")
                    setPage(1)
                  }}
                >
                  {t.home.clearFilter}
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {skills.map((skill) => (
                    <Link key={skill.id} href={`/skills/${skill.id}`}>
                      <SkillCard
                        id={skill.id}
                        name={skill.name}
                        description={skill.description}
                        stars={skill.stars_count}
                        forks={skill.forks_count}
                        downloads={skill.downloads_count}
                        price={skill.price}
                        priceType={skill.price_type}
                      />
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                    >
                        ←
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p =>
                          p === 1 ||
                          p === totalPages ||
                          (p >= page - 1 && p <= page + 1)
                        )
                        .map((p, i, arr) => (
                          <React.Fragment key={p}>
                            {i > 0 && arr[i - 1] !== p - 1 && (
                              <span className="text-slate-400">...</span>
                            )}
                            <Button
                              variant={page === p ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(p)}
                              className={page === p ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-slate-300 bg-white hover:bg-slate-50 text-slate-700"}
                            >
                              {p}
                            </Button>
                          </React.Fragment>
                        ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                    >
                        →
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
