import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加 token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 清除 token 并跳转登录
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export interface Skill {
  id: string
  name: string
  description: string
  github_url: string
  category_id: string | null
  price_type: 'free' | 'paid'
  price: number
  downloads_count: number
  purchases_count: number
  rating: number
  stars_count: number
  forks_count: number
  is_active: boolean
  last_sync_at: string | null
  created_at: string
  updated_at: string
  category?: {
    id: string
    name: string
  }
  tags?: {
    id: string
    name: string
  }[]
}

// API标准响应格式
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface Category {
  id: string
  name: string
  parent_id: string | null
  sort_order: number
  created_at: string
  updated_at: string
  children?: Category[]
}

export interface User {
  id: string
  email: string
  name?: string
  username?: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface Order {
  id: string
  order_no: string
  user_id: string
  total_amount: number
  payment_method: string
  status: string
  created_at: string
  paid_at: string | null
}

export interface Analytics {
  total_revenue: number
  total_orders: number
  total_users: number
  total_skills: number
  active_users: number
  hot_skills: number
  pending_orders: number
  today_orders: number
  recent_orders: Order[]
}

// Skills API
export const skillsApi = {
  getList: async (params?: { page?: number; page_size?: number; category_id?: string; search?: string }) => {
    const response = await api.get('/skills', { params })
    return response.data.data
  },

  getById: async (id: string) => {
    const response = await api.get(`/skills/${id}`)
    return response.data
  },

  download: async (id: string) => {
    const response = await api.get(`/skills/${id}/download`)
    return response.data
  },

  purchase: async (id: string) => {
    const response = await api.post(`/skills/${id}/purchase`)
    return response.data
  },

  getHot: async (limit = 10) => {
    const response = await api.get('/skills/hot', { params: { limit } })
    return response.data
  },

  getTrending: async (limit = 10) => {
    const response = await api.get('/skills/trending', { params: { limit } })
    return response.data
  },
}

// Categories API
export const categoriesApi = {
  getAll: async () => {
    const response = await api.get('/skills/categories')
    return response.data
  },
}

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', { email, password })
    return response.data
  },

  register: async (email: string, password: string, name?: string) => {
    const response = await api.post<LoginResponse>('/auth/register', { email, password, name })
    return response.data
  },

  getOAuthUrl: async (provider: string) => {
    const response = await api.get<{ url: string }>(`/auth/oauth/${provider}`)
    return response.data
  },

  getMe: async () => {
    const response = await api.get<User>('/auth/me')
    return response.data
  },

  updateProfile: async (profileData: {
    name?: string
    username?: string
    bio?: string
    avatar_url?: string
    timezone?: string
    location?: string
    website?: string
    github?: string
    twitter?: string
    linkedin?: string
  }) => {
    const response = await api.put<User>('/auth/profile', profileData)
    return response.data
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put<{ message: string }>('/auth/password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
    return response.data
  },

  getOAuthAccounts: async () => {
    const response = await api.get<Array<{
      provider: string
      provider_user_id: string
      created_at: string
      updated_at: string
    }>>('/auth/oauth-accounts')
    return response.data
  },

  unbindOAuthAccount: async (provider: string) => {
    const response = await api.delete<{ message: string }>(`/auth/oauth-accounts/${provider}`)
    return response.data
  },

  getPreferences: async () => {
    const response = await api.get<{
      language: string
      theme: string
      notifications: {
        email: boolean
        in_app: boolean
        marketing: boolean
      }
      privacy: {
        profile_public: boolean
        analytics_opt_in: boolean
      }
      display: {
        view_mode: string
        items_per_page: number
      }
      search: {
        save_history: boolean
        personalized: boolean
      }
    }>('/auth/preferences')
    return response.data
  },

  updatePreferences: async (preferences: {
    language?: string
    theme?: string
    notifications?: {
      email?: boolean
      in_app?: boolean
      marketing?: boolean
    }
    privacy?: {
      profile_public?: boolean
      analytics_opt_in?: boolean
    }
    display?: {
      view_mode?: string
      items_per_page?: number
    }
    search?: {
      save_history?: boolean
      personalized?: boolean
    }
  }) => {
    const response = await api.put<{ message: string; preferences: any }>('/auth/preferences', preferences)
    return response.data
  },
}

// Payment API
export const paymentApi = {
  createOrder: async (skillId: string) => {
    const response = await api.post<ApiResponse<Order>>('/payment/orders', { skill_id: skillId })
    return response.data
  },

  getPaymentUrl: async (orderId: string) => {
    const response = await api.post<ApiResponse<{ payment_url: string; order_id: string; order_no: string }>>(
      `/payment/orders/${orderId}/pay`
    )
    return response.data
  },

  getOrders: async (params?: { page?: number; page_size?: number }) => {
    const response = await api.get<ApiResponse<{ list: Order[]; total: number; page: number; page_size: number }>>(
      '/payment/orders',
      { params }
    )
    return response.data
  },

  mockCallback: async (orderNo: string, tradeStatus: string, paymentType?: string, tradeNo?: string, totalAmount?: string) => {
    const response = await api.post('/payment/callback/mock', {
      order_no: orderNo,
      trade_status: tradeStatus,
      payment_type: paymentType || 'mock',
      trade_no: tradeNo || `mock_trade_${Date.now()}`,
      total_amount: totalAmount || '0.00',
    })
    return response.data
  },
}

// Dashboard API
export interface UserDashboardStats {
  total_orders: number
  total_skills: number
  total_downloads: number
  learning_progress: number
  recent_activity: Array<{
    id: string
    type: 'purchase' | 'download' | 'view'
    title: string
    description: string
    timestamp: string
  }>
}

export interface PlatformStats {
  total_users: number
  total_skills: number
  total_downloads: number
  active_users: number
  categories: number
}

export const dashboardApi = {
  getUserDashboard: async () => {
    const response = await api.get<ApiResponse<UserDashboardStats>>('/dashboard/stats')
    return response.data
  },

  getPlatformStats: async () => {
    const response = await api.get<ApiResponse<PlatformStats>>('/analytics/platform')
    return response.data
  },
}

export default api
