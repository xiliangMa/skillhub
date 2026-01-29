"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { User } from "@/lib/api"

interface UserContextType {
  user: User | null
  loading: boolean
  login: (user: User, token: string) => void
  logout: () => void
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 初始化时从localStorage读取用户信息
  useEffect(() => {
    const loadUser = () => {
      try {
        const userStr = localStorage.getItem('user')
        const token = localStorage.getItem('token')
        if (userStr && token) {
          setUser(JSON.parse(userStr))
        }
      } catch (error) {
        console.error('Failed to load user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  // 监听localStorage变化（用于跨标签页同步）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user') {
        const userStr = e.newValue
        if (userStr) {
          setUser(JSON.parse(userStr))
        } else {
          setUser(null)
        }
      }
      if (e.key === 'token' && e.newValue === null) {
        setUser(null)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const login = (user: User, token: string) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setUser(user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const { authApi } = await import('@/lib/api')
      const userData = await authApi.getMe()
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      logout()
    }
  }

  return (
    <UserContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
