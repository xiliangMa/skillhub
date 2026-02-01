"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/user-context"
import { useI18n } from "@/contexts/i18n-context"
import {
  Home,
  User,
  ShoppingCart,
  Shield,
  Settings,
  Code,
  ChartBar,
  Menu,
  X,
  LogOut,
  ChevronRight,
  UserCircle,
  Bell,
  CreditCard,
  Lock,
  Globe,
  Star,
  Download,
  Upload,
  BarChart3
} from "lucide-react"

interface NavItem {
  icon: React.ReactNode
  label: string
  href: string
  description?: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, logout } = useUser()
  const { t } = useI18n()

  // 关闭移动端菜单当路由变化时
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // 如果没有登录，重定向到登录页
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  const navItems: NavItem[] = [
    {
      icon: <Home className="h-5 w-5" />,
      label: t.dashboard?.nav?.dashboard || "仪表板",
      href: "/dashboard",
      description: t.dashboard?.nav?.dashboardDesc || "数据概览和快速访问"
    },
    {
      icon: <User className="h-5 w-5" />,
      label: t.dashboard?.nav?.profile || "个人信息",
      href: "/dashboard/profile",
      description: t.dashboard?.nav?.profileDesc || "管理个人资料和头像"
    },
    {
      icon: <ShoppingCart className="h-5 w-5" />,
      label: t.dashboard?.nav?.orders || "购买历史",
      href: "/dashboard/orders",
      description: t.dashboard?.nav?.ordersDesc || "查看订单和下载记录"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      label: t.dashboard?.nav?.security || "账户安全",
      href: "/dashboard/security",
      description: t.dashboard?.nav?.securityDesc || "密码和第三方账号管理"
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: t.dashboard?.nav?.preferences || "偏好设置",
      href: "/dashboard/preferences",
      description: t.dashboard?.nav?.preferencesDesc || "语言、主题和通知设置"
    },
    {
      icon: <Code className="h-5 w-5" />,
      label: t.dashboard?.nav?.mySkills || "我的技能",
      href: "/dashboard/my-skills",
      description: t.dashboard?.nav?.mySkillsDesc || "管理和上传技能包"
    },
    {
      icon: <ChartBar className="h-5 w-5" />,
      label: t.dashboard?.nav?.analytics || "数据分析",
      href: "/dashboard/analytics",
      description: t.dashboard?.nav?.analyticsDesc || "学习进度和使用统计"
    }
  ]

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-slate-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // 重定向中
  }

  return (
     <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      {/* 移动端菜单按钮 */}
      <div className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 md:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-slate-700 dark:text-slate-300" />
          ) : (
            <Menu className="h-6 w-6 text-slate-700 dark:text-slate-300" />
          )}
        </button>
      </div>

       <div className="flex">
        {/* 桌面端侧边栏 */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
          <div className="flex flex-col flex-1 min-h-0 border-r border-slate-200 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex flex-col flex-1 pt-5 pb-4 overflow-y-auto">
              {/* Logo 和品牌 */}
              <div className="flex items-center px-4">
                <Link href="/" className="flex items-center space-x-2 group">
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-500" />
                    <div className="relative w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                      <span className="text-slate-900 dark:text-slate-100 font-bold text-sm">S</span>
                    </div>
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    SkillsHub
                  </span>
                </Link>
              </div>

              {/* 用户信息卡片 */}
              <div className="mt-6 px-4">
                <div className="group relative rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-800/50 p-4 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-500" />
                      <div className="relative w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <UserCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {user.name || user.username || user.email}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {user.email}
                      </p>
                      <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                        {user.role === "admin" ? "管理员" : "普通用户"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 导航菜单 */}
              <nav className="mt-8 flex-1 px-2 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
                        ${isActive
                          ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/30 shadow-sm"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                        }
                      `}
                    >
                      <div className={`
                        mr-3 flex-shrink-0 transition-transform group-hover:scale-110
                        ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}
                      `}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.description}
                        </div>
                      </div>
                      {isActive && (
                        <ChevronRight className="h-4 w-4 text-blue-600 dark:text-blue-400 ml-2" />
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* 底部操作 */}
              <div className="px-2 py-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                >
                  <LogOut className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  {t.nav?.logout || "退出登录"}
                </button>

                <Link
                  href="/"
                  className="mt-2 w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group"
                >
                  <Home className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  返回首页
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* 移动端菜单抽屉 */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="fixed inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white/95 backdrop-blur-xl dark:bg-slate-900/95 shadow-2xl animate-in slide-in-from-left duration-300">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-60" />
                        <div className="relative w-8 h-8 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center">
                          <span className="text-slate-900 dark:text-slate-100 font-bold text-sm">S</span>
                        </div>
                      </div>
                      <span className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        SkillsHub
                      </span>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <X className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto py-4">
                  {/* 用户信息 */}
                  <div className="px-4 mb-6">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                      <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-50" />
                        <div className="relative w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center">
                          <UserCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {user.name || user.username || user.email}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 导航菜单 */}
                  <nav className="px-2 space-y-1">
                    {navItems.map((item) => {
                      const isActive = pathname === item.href
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`
                            flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors
                            ${isActive
                              ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-700 dark:text-blue-300"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }
                          `}
                        >
                          <div className={`
                            mr-3
                            ${isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}
                          `}>
                            {item.icon}
                          </div>
                          <div>
                            <div className="font-medium">{item.label}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </nav>
                </div>

                {/* 底部操作 */}
                <div className="border-t border-slate-200 dark:border-slate-800 p-4">
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full flex items-center justify-center px-3 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mb-2"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t.nav?.logout || "退出登录"}
                  </button>

                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center px-3 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    返回首页
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 主内容区域 */}
        <main className="flex-1 md:pl-64">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}