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
    return response.data.data
  },

  getTrending: async (limit = 10) => {
    const response = await api.get('/skills/trending', { params: { limit } })
    return response.data.data
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

  register: async (email: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/register', { email, password })
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
}

export default api
