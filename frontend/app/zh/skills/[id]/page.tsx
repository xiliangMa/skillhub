"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { skillsApi, paymentApi, type Skill } from "@/lib/api"
import { 
  Star, 
  GitFork, 
  Download, 
  ArrowLeft, 
  ShoppingCart, 
  ExternalLink, 
  CheckCircle, 
  Code, 
  Package, 
  Settings,
  Calendar,
  Users,
  FileText,
  Shield,
  Zap,
  Globe
} from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/contexts/i18n-context"

export default function SkillDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t, locale } = useI18n()
  const [skill, setSkill] = useState<Skill | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const localeValue = locale || 'en'

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

      // 1. 创建订单
      const orderResponse = await paymentApi.createOrder(skill.id)
      if (orderResponse.code !== 0) {
        throw new Error(orderResponse.message || 'Failed to create order')
      }

      const orderId = orderResponse.data.id

      // 2. 获取支付链接
      const paymentResponse = await paymentApi.getPaymentUrl(orderId)
      if (paymentResponse.code !== 0) {
        throw new Error(paymentResponse.message || 'Failed to get payment URL')
      }

      // 3. 跳转到支付页面
      window.location.href = paymentResponse.data.payment_url
    } catch (error) {
      console.error('Failed to purchase skill:', error)
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-64 bg-slate-200 rounded mb-4"></div>
          <div className="h-4 w-96 bg-slate-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!skill) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Alert className="w-96 mb-4">
          <AlertDescription>{localeValue === 'zh' ? '技能不存在或已被删除' : 'Skill not found or has been deleted'}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push('/skills')}>
          {localeValue === 'zh' ? '返回技能列表' : 'Back to Skills'}
        </Button>
      </div>
    )
  }

  const isPaid = skill.price_type === 'paid'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation Header */}
      <div className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/skills">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {localeValue === 'zh' ? '返回技能市场' : 'Back to Marketplace'}
              </Button>
            </Link>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{skill.rating.toFixed(1)}</span>
                <span>({skill.stars_count})</span>
              </div>
              <Badge variant={isPaid ? "default" : "outline"} className={isPaid ? "bg-emerald-600" : ""}>
                {isPaid ? `$${skill.price.toFixed(2)}` : t.home.free}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    {skill.category && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        {skill.category.name}
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-slate-300">
                      <GitFork className="h-3 w-3 mr-1" />
                      {skill.forks_count}
                    </Badge>
                  </div>
                  
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                    {skill.name}
                  </h1>
                  
                  <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                    {skill.description || (localeValue === 'zh' ? '一个强大的AI技能，提供智能解决方案。' : 'A powerful AI skill providing intelligent solutions.')}
                  </p>

                  {/* Tags */}
                  {skill.tags && skill.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {skill.tags.map((tag) => (
                        <Badge 
                          key={tag.id} 
                          variant="outline"
                          className="bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-2xl font-bold text-slate-900">{skill.stars_count.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-600">{localeValue === 'zh' ? 'GitHub星标' : 'GitHub Stars'}</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Download className="h-5 w-5 text-blue-500" />
                        <span className="text-2xl font-bold text-slate-900">{skill.downloads_count.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-600">{t.home.downloads}</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Users className="h-5 w-5 text-emerald-500" />
                        <span className="text-2xl font-bold text-slate-900">{skill.purchases_count.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-600">{localeValue === 'zh' ? '购买用户' : 'Purchases'}</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Calendar className="h-5 w-5 text-purple-500" />
                        <span className="text-2xl font-bold text-slate-900">
                          {new Date(skill.updated_at).toLocaleDateString(localeValue === 'zh' ? 'zh-CN' : 'en-US', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{localeValue === 'zh' ? '最近更新' : 'Last Updated'}</p>
                    </div>
                  </div>
                </div>

                {/* Action Card */}
                <div className="md:w-80">
                  <Card className="border-slate-200 shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl flex items-center gap-2">
                        {isPaid ? (
                          <>
                            <ShoppingCart className="h-5 w-5 text-emerald-600" />
                            <span>{localeValue === 'zh' ? '购买技能' : 'Purchase Skill'}</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-5 w-5 text-blue-600" />
                            <span>{localeValue === 'zh' ? '免费下载' : 'Free Download'}</span>
                          </>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {localeValue === 'zh' ? '立即获取此技能，提升您的工作效率' : 'Get this skill now to boost your productivity'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center py-4">
                        <div className="text-4xl font-bold text-slate-900 mb-2">
                          {isPaid ? `$${skill.price.toFixed(2)}` : t.home.free}
                        </div>
                        <p className="text-sm text-slate-600">
                          {isPaid 
                            ? (localeValue === 'zh' ? '一次性购买，永久使用' : 'One-time purchase, lifetime access')
                            : (localeValue === 'zh' ? '完全免费，开源许可' : 'Completely free, open source license')
                          }
                        </p>
                      </div>

                      <Button 
                        size="lg" 
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        onClick={handlePurchase}
                        disabled={purchasing}
                      >
                        {purchasing ? (
                          <span className="flex items-center gap-2">
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {localeValue === 'zh' ? '处理中...' : 'Processing...'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            {isPaid ? (
                              <>
                                <ShoppingCart className="h-5 w-5" />
                                {localeValue === 'zh' ? '立即购买' : 'Buy Now'}
                              </>
                            ) : (
                              <>
                                <Download className="h-5 w-5" />
                                {localeValue === 'zh' ? '免费下载' : 'Download Free'}
                              </>
                            )}
                          </span>
                        )}
                      </Button>

                      {isPaid && (
                        <div className="text-center text-sm text-slate-600">
                          {localeValue === 'zh' ? '30天退款保证' : '30-day money-back guarantee'}
                        </div>
                      )}

                      <Separator />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{localeValue === 'zh' ? '许可证' : 'License'}</span>
                          <Badge variant="outline">MIT</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{localeValue === 'zh' ? '支持' : 'Support'}</span>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            {localeValue === 'zh' ? '社区支持' : 'Community'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">{localeValue === 'zh' ? '更新频率' : 'Updates'}</span>
                          <span className="font-medium">{localeValue === 'zh' ? '定期' : 'Regular'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* GitHub Card */}
                  {skill.github_url && (
                    <Card className="mt-4 border-slate-200">
                      <CardContent className="p-4">
                        <Button 
                          variant="outline" 
                          className="w-full border-slate-300 hover:bg-slate-50"
                          asChild
                        >
                          <a
                            href={skill.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>{localeValue === 'zh' ? '查看GitHub仓库' : 'View on GitHub'}</span>
                          </a>
                        </Button>
                        <p className="text-xs text-slate-500 text-center mt-3">
                          {localeValue === 'zh' ? '开源代码，透明可信' : 'Open source, transparent and trustworthy'}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <Card className="border-slate-200 shadow-sm">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b">
                  <TabsList className="w-full justify-start h-14 px-6 bg-transparent">
                    <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600">
                      <FileText className="h-4 w-4 mr-2" />
                      {localeValue === 'zh' ? '概览' : 'Overview'}
                    </TabsTrigger>
                    <TabsTrigger value="features" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600">
                      <Zap className="h-4 w-4 mr-2" />
                      {localeValue === 'zh' ? '功能' : 'Features'}
                    </TabsTrigger>
                    <TabsTrigger value="installation" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600">
                      <Package className="h-4 w-4 mr-2" />
                      {localeValue === 'zh' ? '安装' : 'Installation'}
                    </TabsTrigger>
                    <TabsTrigger value="configuration" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600">
                      <Settings className="h-4 w-4 mr-2" />
                      {localeValue === 'zh' ? '配置' : 'Configuration'}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="overview" className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-4">
                        {localeValue === 'zh' ? '技能简介' : 'Skill Overview'}
                      </h3>
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 leading-relaxed">
                          {skill.description || (localeValue === 'zh' 
                            ? '这是一个功能强大的AI技能，旨在帮助开发者和团队提高工作效率。通过智能算法和优化的流程，可以显著减少重复性工作，让您专注于更有价值的任务。'
                            : 'This is a powerful AI skill designed to help developers and teams improve their productivity. Through intelligent algorithms and optimized workflows, it significantly reduces repetitive tasks, allowing you to focus on more valuable work.'
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="border-slate-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="h-5 w-5 text-emerald-600" />
                            {localeValue === 'zh' ? '安全可靠' : 'Secure & Reliable'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600">
                            {localeValue === 'zh' 
                              ? '经过严格测试，保证在各种环境下稳定运行，遵循最佳安全实践。'
                              : 'Thoroughly tested to ensure stable operation in various environments, following best security practices.'
                            }
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-slate-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Globe className="h-5 w-5 text-blue-600" />
                            {localeValue === 'zh' ? '多平台支持' : 'Cross-platform'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600">
                            {localeValue === 'zh' 
                              ? '支持Windows、macOS、Linux等多种操作系统，兼容主流开发环境。'
                              : 'Supports Windows, macOS, Linux, and other operating systems, compatible with mainstream development environments.'
                            }
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="features" className="space-y-4">
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">
                      {localeValue === 'zh' ? '核心功能' : 'Core Features'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { 
                          title: localeValue === 'zh' ? '智能自动化' : 'Intelligent Automation',
                          desc: localeValue === 'zh' ? '自动化重复性任务，提升工作效率' : 'Automate repetitive tasks to boost productivity'
                        },
                        { 
                          title: localeValue === 'zh' ? '实时分析' : 'Real-time Analysis',
                          desc: localeValue === 'zh' ? '实时数据处理和分析，快速洞察' : 'Real-time data processing and analysis for quick insights'
                        },
                        { 
                          title: localeValue === 'zh' ? 'API集成' : 'API Integration',
                          desc: localeValue === 'zh' ? '轻松集成第三方服务和API' : 'Easy integration with third-party services and APIs'
                        },
                        { 
                          title: localeValue === 'zh' ? '自定义配置' : 'Custom Configuration',
                          desc: localeValue === 'zh' ? '高度可配置，满足个性化需求' : 'Highly configurable to meet personalized needs'
                        },
                        { 
                          title: localeValue === 'zh' ? '数据可视化' : 'Data Visualization',
                          desc: localeValue === 'zh' ? '直观的数据图表和报告' : 'Intuitive data charts and reports'
                        },
                        { 
                          title: localeValue === 'zh' ? '团队协作' : 'Team Collaboration',
                          desc: localeValue === 'zh' ? '支持多用户协作和权限管理' : 'Supports multi-user collaboration and permission management'
                        },
                      ].map((feature, index) => (
                        <div key={index} className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-colors">
                          <div className="flex-shrink-0 mt-1">
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-900 mb-1">{feature.title}</h4>
                            <p className="text-sm text-slate-600">{feature.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="installation" className="space-y-4">
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">
                      {localeValue === 'zh' ? '安装指南' : 'Installation Guide'}
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">npm</h4>
                        <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-sm">
                          npm install {skill.name.toLowerCase().replace(/\s+/g, '-')}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">yarn</h4>
                        <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-sm">
                          yarn add {skill.name.toLowerCase().replace(/\s+/g, '-')}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">{localeValue === 'zh' ? '手动安装' : 'Manual Installation'}</h4>
                        <div className="space-y-2">
                          <p className="text-sm text-slate-600">
                            {localeValue === 'zh' 
                              ? '克隆GitHub仓库到本地：'
                              : 'Clone the GitHub repository locally:'
                            }
                          </p>
                          <div className="bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-sm">
                            git clone {skill.github_url || 'https://github.com/example/repo'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="configuration" className="space-y-4">
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">
                      {localeValue === 'zh' ? '配置选项' : 'Configuration Options'}
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3">{localeValue === 'zh' ? '基础配置' : 'Basic Configuration'}</h4>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <pre className="text-sm text-slate-700 whitespace-pre-wrap">
                            {`{
  "apiKey": "your-api-key-here",
  "environment": "production",
  "logLevel": "info",
  "cacheEnabled": true,
  "timeout": 30000
}`}
                          </pre>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-2">{localeValue === 'zh' ? '环境变量' : 'Environment Variables'}</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between py-2 border-b border-slate-100">
                            <code className="text-sm font-mono text-blue-600">API_KEY</code>
                            <span className="text-sm text-slate-600">{localeValue === 'zh' ? '必填，API密钥' : 'Required, API key'}</span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-slate-100">
                            <code className="text-sm font-mono text-blue-600">LOG_LEVEL</code>
                            <span className="text-sm text-slate-600">{localeValue === 'zh' ? '可选，日志级别' : 'Optional, log level'}</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <code className="text-sm font-mono text-blue-600">DEBUG_MODE</code>
                            <span className="text-sm text-slate-600">{localeValue === 'zh' ? '可选，调试模式' : 'Optional, debug mode'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </Card>

            {/* Community Section */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {localeValue === 'zh' ? '社区支持' : 'Community Support'}
                </CardTitle>
                <CardDescription>
                  {localeValue === 'zh' ? '加入社区获取帮助和分享经验' : 'Join the community for help and experience sharing'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="justify-start h-auto py-3 border-slate-300 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{localeValue === 'zh' ? '文档' : 'Documentation'}</div>
                        <div className="text-xs text-slate-500">{localeValue === 'zh' ? '详细使用指南' : 'Detailed usage guide'}</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="justify-start h-auto py-3 border-slate-300 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Code className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{localeValue === 'zh' ? '示例代码' : 'Examples'}</div>
                        <div className="text-xs text-slate-500">{localeValue === 'zh' ? '实用代码示例' : 'Practical code examples'}</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="justify-start h-auto py-3 border-slate-300 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <ExternalLink className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">{localeValue === 'zh' ? 'GitHub讨论' : 'GitHub Discussions'}</div>
                        <div className="text-xs text-slate-500">{localeValue === 'zh' ? '提问和讨论' : 'Questions and discussions'}</div>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Author Card */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{localeValue === 'zh' ? '发布者' : 'Publisher'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {skill.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{skill.name.split('-')[0] || skill.name}</div>
                    <div className="text-sm text-slate-600">{localeValue === 'zh' ? '官方发布' : 'Official Publisher'}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{localeValue === 'zh' ? '已发布技能' : 'Published Skills'}</span>
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{localeValue === 'zh' ? '总下载量' : 'Total Downloads'}</span>
                    <span className="font-semibold">45.2k</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{localeValue === 'zh' ? '评分' : 'Rating'}</span>
                    <span className="font-semibold">4.8/5.0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Version History */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{localeValue === 'zh' ? '版本历史' : 'Version History'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { version: 'v2.1.0', date: '2024-01-15', changes: localeValue === 'zh' ? '性能优化' : 'Performance improvements' },
                    { version: 'v2.0.0', date: '2023-12-01', changes: localeValue === 'zh' ? '重大更新' : 'Major update' },
                    { version: 'v1.5.3', date: '2023-10-20', changes: localeValue === 'zh' ? 'Bug修复' : 'Bug fixes' },
                    { version: 'v1.5.0', date: '2023-09-15', changes: localeValue === 'zh' ? '新功能' : 'New features' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-slate-900">{item.version}</span>
                          <span className="text-xs text-slate-500">{item.date}</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{item.changes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Related Skills */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">{localeValue === 'zh' ? '相关技能' : 'Related Skills'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'AI Code Assistant', category: 'Development', stars: '4.9k' },
                    { name: 'Data Analyzer Pro', category: 'Analytics', stars: '3.2k' },
                    { name: 'Auto Workflow', category: 'Automation', stars: '2.8k' },
                  ].map((skillItem, index) => (
                    <div key={index} className="p-3 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-colors cursor-pointer">
                      <div className="font-medium text-slate-900">{skillItem.name}</div>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-xs">{skillItem.category}</Badge>
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {skillItem.stars}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                  {localeValue === 'zh' ? '查看更多相关技能 →' : 'View more related skills →'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
