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
          <AlertDescription>技能不存在或已被删除</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push('/zh/skills')}>
          返回技能列表
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
            <Link href="/zh/skills">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                返回技能市场
              </Button>
            </Link>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{skill.rating.toFixed(1)}</span>
                <span>({skill.stars_count})</span>
              </div>
              <Badge variant={isPaid ? "default" : "outline"} className={isPaid ? "bg-emerald-600" : ""}>
                {isPaid ? `¥${skill.price.toFixed(2)}` : '免费'}
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
                    {skill.description || '一个强大的AI技能，提供智能解决方案。'}
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
                      <p className="text-sm text-slate-600">GitHub星标</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Download className="h-5 w-5 text-blue-500" />
                        <span className="text-2xl font-bold text-slate-900">{skill.downloads_count.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-600">下载次数</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Users className="h-5 w-5 text-emerald-500" />
                        <span className="text-2xl font-bold text-slate-900">{skill.purchases_count.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-600">购买用户</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Calendar className="h-5 w-5 text-purple-500" />
                        <span className="text-2xl font-bold text-slate-900">
                          {new Date(skill.updated_at).toLocaleDateString('zh-CN', { 
                            year: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">最近更新</p>
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
                            <span>购买技能</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-5 w-5 text-blue-600" />
                            <span>免费下载</span>
                          </>
                        )}
                      </CardTitle>
                      <CardDescription>
                        立即获取此技能，提升您的工作效率
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center py-4">
                        <div className="text-4xl font-bold text-slate-900 mb-2">
                          {isPaid ? `¥${skill.price.toFixed(2)}` : '免费'}
                        </div>
                        <p className="text-sm text-slate-600">
                          {isPaid 
                            ? '一次性购买，永久使用'
                            : '完全免费，开源许可'
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
                            处理中...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            {isPaid ? (
                              <>
                                <ShoppingCart className="h-5 w-5" />
                                立即购买
                              </>
                            ) : (
                              <>
                                <Download className="h-5 w-5" />
                                免费下载
                              </>
                            )}
                          </span>
                        )}
                      </Button>

                      {isPaid && (
                        <div className="text-center text-sm text-slate-600">
                          30天退款保证
                        </div>
                      )}

                      <Separator />

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">许可证</span>
                          <Badge variant="outline">MIT</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">支持</span>
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            社区支持
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">更新频率</span>
                          <span className="font-medium">定期</span>
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
                            <span>查看GitHub仓库</span>
                          </a>
                        </Button>
                        <p className="text-xs text-slate-500 text-center mt-3">
                          开源代码，透明可信
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
                      概览
                    </TabsTrigger>
                    <TabsTrigger value="features" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600">
                      <Zap className="h-4 w-4 mr-2" />
                      功能
                    </TabsTrigger>
                    <TabsTrigger value="installation" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600">
                      <Package className="h-4 w-4 mr-2" />
                      安装
                    </TabsTrigger>
                    <TabsTrigger value="configuration" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600">
                      <Settings className="h-4 w-4 mr-2" />
                      配置
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="overview" className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-4">
                        技能简介
                      </h3>
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-700 leading-relaxed">
                          {skill.description || '这是一个功能强大的AI技能，旨在帮助开发者和团队提高工作效率。通过智能算法和优化的流程，可以显著减少重复性工作，让您专注于更有价值的任务。'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="border-slate-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="h-5 w-5 text-emerald-600" />
                            安全可靠
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600">
                            经过严格测试，保证在各种环境下稳定运行，遵循最佳安全实践。
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="border-slate-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Globe className="h-5 w-5 text-blue-600" />
                            多平台支持
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600">
                            支持Windows、macOS、Linux等多种操作系统，兼容主流开发环境。
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="features" className="space-y-4">
                    <h3 className="text-xl font-semibold text-slate-900 mb-4">
                      核心功能
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { 
                          title: '智能自动化',
                          desc: '自动化重复性任务，提升工作效率'
                        },
                        { 
                          title: '实时分析',
                          desc: '实时数据处理和分析，快速洞察'
                        },
                        { 
                          title: 'API集成',
                          desc: '轻松集成第三方服务和API'
                        },
                        { 
                          title: '自定义配置',
                          desc: '高度可配置，满足个性化需求'
                        },
                        { 
                          title: '数据可视化',
                          desc: '直观的数据图表和报告'
                        },
                        { 
                          title: '团队协作',
                          desc: '支持多用户协作和权限管理'
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
                      安装指南
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
                        <h4 className="font-semibold text-slate-900 mb-2">手动安装</h4>
                        <div className="space-y-2">
                          <p className="text-sm text-slate-600">
                            克隆GitHub仓库到本地：
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
                      配置选项
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3">基础配置</h4>
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
                        <h4 className="font-semibold text-slate-900 mb-2">环境变量</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between py-2 border-b border-slate-100">
                            <code className="text-sm font-mono text-blue-600">API_KEY</code>
                            <span className="text-sm text-slate-600">必填，API密钥</span>
                          </div>
                          <div className="flex items-center justify-between py-2 border-b border-slate-100">
                            <code className="text-sm font-mono text-blue-600">LOG_LEVEL</code>
                            <span className="text-sm text-slate-600">可选，日志级别</span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <code className="text-sm font-mono text-blue-600">DEBUG_MODE</code>
                            <span className="text-sm text-slate-600">可选，调试模式</span>
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
                  社区支持
                </CardTitle>
                <CardDescription>
                  加入社区获取帮助和分享经验
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
                        <div className="font-semibold">文档</div>
                        <div className="text-xs text-slate-500">详细使用指南</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="justify-start h-auto py-3 border-slate-300 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Code className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">示例代码</div>
                        <div className="text-xs text-slate-500">实用代码示例</div>
                      </div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="justify-start h-auto py-3 border-slate-300 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <ExternalLink className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold">GitHub讨论</div>
                        <div className="text-xs text-slate-500">提问和讨论</div>
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
                <CardTitle className="text-lg">发布者</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {skill.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{skill.name.split('-')[0] || skill.name}</div>
                    <div className="text-sm text-slate-600">官方发布</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">已发布技能</span>
                    <span className="font-semibold">12</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">总下载量</span>
                    <span className="font-semibold">45.2k</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">评分</span>
                    <span className="font-semibold">4.8/5.0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Version History */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">版本历史</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { version: 'v2.1.0', date: '2024-01-15', changes: '性能优化' },
                    { version: 'v2.0.0', date: '2023-12-01', changes: '重大更新' },
                    { version: 'v1.5.3', date: '2023-10-20', changes: 'Bug修复' },
                    { version: 'v1.5.0', date: '2023-09-15', changes: '新功能' },
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
                <CardTitle className="text-lg">相关技能</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'AI代码助手', category: '开发工具', stars: '4.9k' },
                    { name: '数据分析专家', category: '数据分析', stars: '3.2k' },
                    { name: '自动化工作流', category: '自动化', stars: '2.8k' },
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
                  查看更多相关技能 →
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
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
