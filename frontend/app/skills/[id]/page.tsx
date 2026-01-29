"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { skillsApi, type Skill } from "@/lib/api"
import { Star, GitFork, Download, ArrowLeft, ShoppingCart, ExternalLink, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/contexts/i18n-context"

export default function SkillDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t, locale } = useI18n()
  const [skill, setSkill] = useState<Skill | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  const localeValue = locale || 'en' // 确保locale有默认值

  useEffect(() => {
    if (params.id) {
      fetchSkill(params.id as string)
    }
  }, [params.id])

  const fetchSkill = async (id: string) => {
    setLoading(true)
    try {
      const response = await skillsApi.getById(id)
      setSkill(response.data)
    } catch (error) {
      console.error('Failed to fetch skill:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async () => {
    if (!skill) return

    setPurchasing(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        const loginPath = locale === 'zh' ? '/zh/login' : '/login'
        router.push(loginPath)
        return
      }

      // TODO: Implement purchase flow
      alert('购买功能开发中')
    } catch (error) {
      console.error('Failed to purchase skill:', error)
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!skill) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-muted-foreground mb-4">技能不存在</p>
        <Button variant="outline" onClick={() => router.push('/skills')}>
          返回技能列表
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <Link href="/skills">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              ← {t.home.learnMore}
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Title Section */}
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{skill.name}</h1>
                {skill.category && (
                  <Badge variant="secondary" className="mb-2">
                    {skill.category.name}
                  </Badge>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold mb-2">
                  {skill.price_type === 'free' ? t.home.free : `$${skill.price.toFixed(2)}`}
                </div>
                {skill.price_type === 'paid' && (
                  <Button
                    size="lg"
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="w-full md:w-auto"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {purchasing ? t.home.loading : 'Buy'}
                  </Button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold text-foreground">{skill.rating.toFixed(1)}</span>
                <span>({skill.stars_count})</span>
              </div>
              <div className="flex items-center gap-1">
                <GitFork className="h-4 w-4" />
                <span>{skill.forks_count} forks</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                <span>{skill.downloads_count} {t.home.downloads}</span>
              </div>
              {skill.price_type === 'paid' && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{skill.purchases_count} purchased</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{localeValue === 'zh' ? '技能描述' : 'Skill Description'}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {skill.description || (localeValue === 'zh' ? '暂无描述' : 'No description available')}
              </p>
            </CardContent>
          </Card>

          {/* Features */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{localeValue === 'zh' ? '功能特点' : 'Features'}</CardTitle>
              <CardDescription>{localeValue === 'zh' ? '此技能的核心功能' : 'Core features of this skill'}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{localeValue === 'zh' ? '智能识别和处理复杂业务逻辑' : 'Intelligent recognition and processing of complex business logic'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{localeValue === 'zh' ? '高度可配置的参数和选项' : 'Highly configurable parameters and options'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{localeValue === 'zh' ? '完善的错误处理和日志记录' : 'Comprehensive error handling and logging'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{localeValue === 'zh' ? '持续更新和技术支持' : 'Continuous updates and technical support'}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* GitHub Link */}
          {skill.github_url && (
            <Card>
              <CardHeader>
                <CardTitle>{localeValue === 'zh' ? '源代码' : 'Source Code'}</CardTitle>
                <CardDescription>{localeValue === 'zh' ? '查看完整源代码和文档' : 'View complete source code and documentation'}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <a
                    href={skill.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {localeValue === 'zh' ? '访问 GitHub' : 'Visit GitHub'}
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
