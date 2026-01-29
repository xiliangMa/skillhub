"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authApi } from "@/lib/api"
import Link from "next/link"
import { useI18n } from "@/contexts/i18n-context"
import { Github, Mail, ArrowRight, LogIn, UserPlus } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { t, locale } = useI18n()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      let response
      if (isLogin) {
        response = await authApi.login(email, password)
      } else {
        response = await authApi.register(email, password)
      }
      
      localStorage.setItem('token', response.token)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      if (locale === 'zh') {
        router.push('/zh')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      const errorMsg = isLogin ? t.auth.errorLoginFailed : t.auth.errorRegisterFailed
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: string) => {
    try {
      const response = await authApi.getOAuthUrl(provider)
      if (response?.auth_url) {
        window.location.href = response.auth_url
      }
    } catch (error) {
      console.error('OAuth login failed:', error)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
      <Card className="w-full max-w-md border-slate-200 bg-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-slate-900">
            {isLogin ? t.auth.loginTitle : t.auth.registerTitle}
          </CardTitle>
          <CardDescription className="text-center text-slate-600">
            {isLogin ? t.auth.loginSubtitle : t.auth.registerSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* OAuth Login Buttons */}
          <div className="space-y-3 mb-6">
            <p className="text-sm text-slate-500 text-center mb-4">
              使用第三方账号{isLogin ? '登录' : '注册'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* GitHub */}
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthLogin('github')}
                disabled={loading}
                className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>

              {/* Google */}
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthLogin('google')}
                disabled={loading}
                className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* WeChat */}
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthLogin('wechat')}
                disabled={loading}
                className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                title="微信登录"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.5,13.5A1.5,1.5 0 1,1 10,15A1.5,1.5 0 0,1 8.5,13.5M15.5,13.5A1.5,1.5 0 1,1 17,15A1.5,1.5 0 0,1 15.5,13.5M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2Z" />
                </svg>
              </Button>

              {/* Feishu */}
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthLogin('feishu')}
                disabled={loading}
                className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                title="飞书登录"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2L2,7L12,12L22,7L12,2Z" />
                  <path d="M2,17L12,22L22,17V7L12,12L2,17Z" opacity="0.5" />
                </svg>
              </Button>

              {/* Xiaohongshu */}
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOAuthLogin('xiaohongshu')}
                disabled={loading}
                className="border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                title="小红书登录"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2ZM12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20Z" />
                  <path d="M12,6C10.34,6 9,7.34 9,9C9,10.66 10.34,12 12,12C13.66,12 15,10.66 15,9C15,7.34 13.66,6 12,6ZM12,10C11.45,10 11,9.55 11,9C11,8.45 11.45,8 12,8C12.55,8 13,8.45 13,9C13,9.55 12.55,10 12,10Z" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">
                或使用邮箱
              </span>
            </div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                {t.auth.emailAddress}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t.auth.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="border-slate-300"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                {t.auth.password}
              </label>
              <Input
                id="password"
                type="password"
                placeholder={t.auth.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
                className="border-slate-300"
              />
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" disabled={loading}>
              {loading ? t.auth.processing : (
                <>
                  {isLogin ? (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      {t.auth.login}
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {t.auth.register}
                    </>
                  )}
                </>
              )}
            </Button>

            <div className="text-center text-sm text-slate-600">
              {isLogin ? t.auth.noAccount : t.auth.hasAccount}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-blue-600 hover:underline font-medium ml-1"
              >
                {isLogin ? t.auth.register : t.auth.login}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
