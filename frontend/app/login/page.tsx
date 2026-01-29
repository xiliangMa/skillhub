"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authApi } from "@/lib/api"
import Link from "next/link"
import { useI18n } from "@/contexts/i18n-context"

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

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/20 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? t.auth.loginTitle : t.auth.registerTitle}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin ? t.auth.loginSubtitle : t.auth.registerSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
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
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
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
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t.auth.processing : (isLogin ? t.auth.login : t.auth.register)}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              {isLogin ? t.auth.noAccount : t.auth.hasAccount}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium ml-1"
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
