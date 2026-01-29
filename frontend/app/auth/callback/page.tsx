"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@/contexts/user-context"

export default function OAuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login: loginUser } = useUser()

  useEffect(() => {
    const token = searchParams.get('token')
    const userStr = searchParams.get('user')

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr))
        loginUser(user, token)
        // 跳转到首页
        router.push('/')
      } catch (error) {
        console.error('Failed to parse user data:', error)
        // 如果解析失败，跳转到登录页
        router.push('/login?error=oauth_failed')
      }
    } else {
      // 如果没有token和user，跳转到登录页
      router.push('/login?error=oauth_failed')
    }
  }, [searchParams, router, loginUser])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]">
          <span className="sr-only">Loading...</span>
        </div>
        <p className="mt-4 text-gray-600">正在登录...</p>
      </div>
    </div>
  )
}
