"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { Card, CardContent } from "@/components/ui/card"

export default function OAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login: loginUser } = useUser()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const provider = searchParams.get('provider')
    const code = searchParams.get('code')
    const token = searchParams.get('token')
    const userStr = searchParams.get('user')

    // 如果有 token 和 user，直接使用
    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr))
        loginUser(user, token)
        setStatus('success')
        setTimeout(() => {
          router.push('/')
        }, 1000)
      } catch (error) {
        console.error('Failed to parse user data:', error)
        setStatus('error')
        setErrorMessage('解析用户信息失败')
        setTimeout(() => {
          router.push('/login?error=oauth_failed')
        }, 2000)
      }
    } else if (code && provider) {
      // 如果有 code 和 provider，需要调用后端回调接口
      handleOAuthCallback(provider, code)
    } else {
      setStatus('error')
      setErrorMessage('缺少授权参数')
      setTimeout(() => {
        router.push('/login?error=oauth_failed')
      }, 2000)
    }
  }, [searchParams, router, loginUser])

  const handleOAuthCallback = async (provider: string, code: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
      const response = await fetch(`${apiUrl}/api/v1/auth/callback/${provider}?code=${code}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('OAuth callback failed')
      }

      const data = await response.json()
      if (data.token && data.user) {
        loginUser(data.user, data.token)
        setStatus('success')
        setTimeout(() => {
          router.push('/')
        }, 1000)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error) {
      console.error('OAuth callback error:', error)
      setStatus('error')
      setErrorMessage('授权失败，请重试')
      setTimeout(() => {
        router.push('/login?error=oauth_failed')
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-white px-4">
      <Card className="w-full max-w-md border-slate-200 bg-white">
        <CardContent className="py-12">
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-t-transparent">
                <span className="sr-only">Loading...</span>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-900">正在处理授权...</p>
                <p className="text-sm text-slate-600">请稍候，我们正在验证您的登录信息</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-900">登录成功！</p>
                <p className="text-sm text-slate-600">正在跳转到首页...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
                <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-900">授权失败</p>
                <p className="text-sm text-slate-600">{errorMessage}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
