"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useUser } from "@/contexts/user-context"
import { useI18n } from "@/contexts/i18n-context"
import { paymentApi } from "@/lib/api"
import {
  ShoppingCart,
  Download,
  Star,
  TrendingUp,
  Clock,
  Award,
  Zap,
  ArrowRight,
  ExternalLink,
  Package,
  CreditCard,
  BookOpen,
  BarChart3
} from "lucide-react"

interface DashboardStats {
  totalOrders: number
  totalSkills: number
  totalDownloads: number
  learningProgress: number
  recentActivity: Array<{
    id: string
    type: 'purchase' | 'download' | 'view'
    title: string
    description: string
    timestamp: string
    icon: React.ReactNode
  }>
  quickActions: Array<{
    title: string
    description: string
    href: string
    icon: React.ReactNode
    buttonText: string
  }>
}

export default function DashboardPage() {
  const { user } = useUser()
  const { t } = useI18n()
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalSkills: 0,
    totalDownloads: 0,
    learningProgress: 0,
    recentActivity: [],
    quickActions: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      try {
        // 这里应该调用API获取仪表板数据
        // 暂时使用模拟数据
        const ordersResponse = await paymentApi.getOrders({ page: 1, page_size: 1 })

        // 模拟数据
        setStats({
          totalOrders: ordersResponse.data?.total || 0,
          totalSkills: 3,
          totalDownloads: 12,
          learningProgress: 65,
          recentActivity: [
            {
              id: '1',
              type: 'purchase',
              title: 'AI聊天助手技能',
              description: '成功购买',
              timestamp: '2小时前',
              icon: <ShoppingCart className="h-5 w-5 text-green-600" />
            },
            {
              id: '2',
              type: 'download',
              title: '数据分析模板',
              description: '下载完成',
              timestamp: '1天前',
              icon: <Download className="h-5 w-5 text-blue-600" />
            },
            {
              id: '3',
              type: 'view',
              title: '机器学习基础',
              description: '学习2小时',
              timestamp: '2天前',
              icon: <BookOpen className="h-5 w-5 text-purple-600" />
            }
          ],
          quickActions: [
            {
              title: t.dashboard?.quickActions?.browseSkills || '浏览技能',
              description: t.dashboard?.quickActions?.browseSkillsDesc || '探索新技能',
              href: '/skills',
              icon: <Package className="h-6 w-6" />,
              buttonText: t.dashboard?.quickActions?.browse || '浏览'
            },
            {
              title: t.dashboard?.quickActions?.purchaseHistory || '购买历史',
              description: t.dashboard?.quickActions?.purchaseHistoryDesc || '查看订单记录',
              href: '/dashboard/orders',
              icon: <CreditCard className="h-6 w-6" />,
              buttonText: t.dashboard?.quickActions?.view || '查看'
            },
            {
              title: t.dashboard?.quickActions?.learningProgress || '学习进度',
              description: t.dashboard?.quickActions?.learningProgressDesc || '查看学习统计',
              href: '/dashboard/analytics',
              icon: <BarChart3 className="h-6 w-6" />,
              buttonText: t.dashboard?.quickActions?.viewProgress || '查看进度'
            }
          ]
        })
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user, t])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded animate-pulse mt-2" />
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 头部欢迎区域 */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {t.dashboard?.welcome || '欢迎回来'}, {user?.name || user?.username || '用户'}!
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              {t.dashboard?.subtitle || '这是您的个人仪表板，可以管理账户、查看进度和访问重要功能。'}
            </p>
          </div>
          <Link href="/skills">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-blue-500/25 transition-all duration-300 text-white">
              <Zap className="h-4 w-4 mr-2" />
              {t.dashboard?.exploreSkills || '探索技能'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t.dashboard?.stats?.totalOrders || '总订单数'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {stats.totalOrders}
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t.dashboard?.stats?.ordersDesc || '已购买技能'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t.dashboard?.stats?.totalSkills || '已拥有技能'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {stats.totalSkills}
              </div>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t.dashboard?.stats?.skillsDesc || '可用的技能包'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t.dashboard?.stats?.totalDownloads || '总下载量'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {stats.totalDownloads}
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Download className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t.dashboard?.stats?.downloadsDesc || '技能包下载次数'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {t.dashboard?.stats?.learningProgress || '学习进度'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {stats.learningProgress}%
              </div>
              <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
            </div>
            <div className="mt-2">
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                  style={{ width: `${stats.learningProgress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 最近活动 */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-slate-500 dark:text-slate-400" />
              {t.dashboard?.recentActivity?.title || '最近活动'}
            </CardTitle>
            <CardDescription>
              {t.dashboard?.recentActivity?.description || '您的最近操作记录'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="flex-shrink-0 mt-1">
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {activity.title}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {activity.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {activity.timestamp}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/dashboard/orders" className="w-full">
              <Button variant="outline" className="w-full">
                {t.dashboard?.recentActivity?.viewAll || '查看全部活动'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* 快速操作 */}
        <Card className="border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-slate-500 dark:text-slate-400" />
              {t.dashboard?.quickActions?.title || '快速操作'}
            </CardTitle>
            <CardDescription>
              {t.dashboard?.quickActions?.description || '常用功能和快捷入口'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.quickActions.map((action, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                      {action.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">
                        {action.title}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <Link href={action.href}>
                    <Button variant="outline" size="sm">
                      {action.buttonText}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <Award className="h-4 w-4 inline mr-1" />
              {t.dashboard?.tip || '提示：'}
              <span className="text-slate-700 dark:text-slate-300 ml-1">
                {t.dashboard?.tipContent || '完成更多学习任务可以解锁成就！'}
              </span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}