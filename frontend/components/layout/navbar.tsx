"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { User, Menu, LogOut, UserCircle, LayoutDashboard, Shield } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { useI18n } from "@/contexts/i18n-context"
import { LanguageSwitcher } from "@/components/language-switcher"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, logout } = useUser()
  const { t } = useI18n()

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 shadow-lg">
      <div className="container mx-auto px-4 md:px-6 flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-500" />
            <div className="relative w-8 h-8 bg-white rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <span className="text-slate-900 font-bold text-sm">S</span>
            </div>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            SkillsHub
          </span>
        </Link>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <LanguageSwitcher />

          {loading ? (
            <div className="h-9 w-20 bg-slate-200 animate-pulse rounded"></div>
          ) : user ? (
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 hover:bg-slate-100 hover:text-blue-600 transition-colors text-slate-700"
              >
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-50" />
                  <div className="relative w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <UserCircle className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <span className="text-sm font-medium">{user.name || user.username || user.email}</span>
              </Button>

               {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-lg shadow-2xl border border-slate-200 py-1 animate-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-slate-200 text-xs text-slate-500 font-mono">
                    {t.nav.loggedIn || '已登录'}
                  </div>
                  {user?.role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors"
                    >
                      <Shield className="h-4 w-4" />
                      {t.nav.adminDashboard || "后台管理"}
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition-colors"
                  >
                     <LayoutDashboard className="h-4 w-4" />
                    {t.nav.personalCenter || "个人中心"}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {t.nav.logout || '退出登录'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="hover:bg-slate-100 hover:text-blue-600 transition-colors text-slate-700">
                  <User className="h-4 w-4 mr-2" />
                  {t.nav.login}
                </Button>
              </Link>

              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-blue-500/25 transition-all duration-300 text-white">
                  {t.nav.register}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl">
          <div className="p-4 space-y-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between px-2">
              <LanguageSwitcher />
            </div>

             {loading ? (
              <div className="h-9 bg-slate-200 animate-pulse rounded"></div>
            ) : user ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg border border-slate-200">
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur opacity-50" />
                    <div className="relative w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <UserCircle className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-slate-700">{user.name || user.username || user.email}</span>
                </div>
                 {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full"
                  >
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-slate-700 hover:bg-slate-100"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {t.nav.adminDashboard || "后台管理"}
                    </Button>
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-700 hover:bg-slate-100"
                  >
                     <LayoutDashboard className="h-4 w-4 mr-2" />
                    {t.nav.personalCenter || "个人中心"}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t.nav.logout || '退出登录'}
                </Button>
              </div>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-slate-700 hover:bg-slate-100 hover:text-blue-600">
                    <User className="h-4 w-4 mr-2" />
                    {t.nav.login}
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    {t.nav.register}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
