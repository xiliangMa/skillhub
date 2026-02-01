"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import api, { type User, type Order, type Analytics, type Skill } from "@/lib/api"
import { Users, DollarSign, ShoppingCart, TrendingUp, Search, LayoutDashboard, Zap, CreditCard, Activity, ChevronRight } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"
import { useUser } from "@/contexts/user-context"

export default function AdminDashboard() {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading: userLoading } = useUser()
  
  const [loading, setLoading] = useState(true)
  const [skills, setSkills] = useState<Skill[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // 根据路径名确定当前活动标签
  const getActiveTab = () => {
    if (pathname.includes('/admin/skills')) return 'skills'
    if (pathname.includes('/admin/users')) return 'users'
    if (pathname.includes('/admin/orders')) return 'orders'
    if (pathname.includes('/admin/analytics')) return 'analytics'
    return 'overview'
  }
  
  const activeTab = getActiveTab()

  useEffect(() => {
    // 等待用户信息加载完成
    if (userLoading) {
      return
    }

    // 未登录时跳转到登录页
    if (user === null) {
      router.push('/login')
      return
    }

    // 非管理员跳转到首页
    if (user.role !== 'admin') {
      router.push('/')
      return
    }
  }, [user, userLoading, router])

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchData()
    }
  }, [activeTab, user])

  const fetchData = async (page = 1) => {
    setLoading(true)
    try {
      const params: any = { page, page_size: pagination.pageSize }
      if (searchTerm) {
        params.search = searchTerm
      }
      if (sortField) {
        params.sort_by = sortField
        params.sort_order = sortOrder
      }

      switch (activeTab) {
        case 'overview':
          const analyticsRes = await api.get('/admin/analytics')
          setAnalytics(analyticsRes.data?.data || analyticsRes.data)
          break
        case 'skills':
          const skillsRes = await api.get('/admin/skills', { params })
          const skillsList = skillsRes.data?.data?.list || skillsRes.data?.list || []
          setSkills(skillsList)
          setPagination({
            page: skillsRes.data?.data?.page || skillsRes.data?.page || 1,
            pageSize: skillsRes.data?.data?.page_size || skillsRes.data?.page_size || 20,
            total: skillsRes.data?.data?.total || skillsRes.data?.total || 0
          })
          setUsers([])
          setOrders([])
          break
        case 'users':
          const usersRes = await api.get('/admin/users', { params })
          const usersList = usersRes.data?.data?.list || usersRes.data?.list || []
          setUsers(usersList)
          setPagination({
            page: usersRes.data?.data?.page || usersRes.data?.page || 1,
            pageSize: usersRes.data?.data?.page_size || usersRes.data?.page_size || 20,
            total: usersRes.data?.data?.total || usersRes.data?.total || 0
          })
          setSkills([])
          setOrders([])
          break
        case 'orders':
          const ordersRes = await api.get('/admin/orders', { params })
          const ordersList = ordersRes.data?.data?.list || ordersRes.data?.list || []
          setOrders(ordersList)
          setPagination({
            page: ordersRes.data?.data?.page || ordersRes.data?.page || 1,
            pageSize: ordersRes.data?.data?.page_size || ordersRes.data?.page_size || 20,
            total: ordersRes.data?.data?.total || ordersRes.data?.total || 0
          })
          setSkills([])
          setUsers([])
          break
        case 'analytics':
          // 对于分析页面，可以加载更多数据
          const analyticsRes2 = await api.get('/admin/analytics')
          setAnalytics(analyticsRes2.data?.data || analyticsRes2.data)
          break
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setPagination({ ...pagination, page: 1 })
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  useEffect(() => {
    if (activeTab !== 'overview' && activeTab !== 'analytics') {
      const timer = setTimeout(() => {
        fetchData(1)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [searchTerm, sortField, sortOrder])

  const OverviewContent = () => (
    <div className="space-y-6">
      {/* 头部欢迎区域 */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 p-6 border border-slate-200/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {t.admin?.welcome || '欢迎回来'}, {user?.name || user?.username || user?.email || '管理员'}!
            </h1>
            <p className="mt-2 text-slate-600">
              {t.admin?.subtitle || '这是您的管理仪表板，可以监控平台数据、管理用户和技能。'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100/50 to-purple-100/50">
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
          <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-100/50 to-pink-100/50">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-green-600 text-xs font-medium bg-green-100 px-2 py-1 rounded-full">
                +12.5%
              </div>
            </div>
            <h3 className="text-sm text-slate-500 mb-2">{t.admin.totalRevenue || '总收入'}</h3>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {analytics?.total_revenue ? `$${analytics.total_revenue.toFixed(2)}` : '$0.00'}
            </div>
            <p className="text-xs text-slate-400">
              {analytics?.today_orders || 0} {t.admin.todayOrders || '今日订单'}
            </p>
          </div>
        </div>

        {/* Orders Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
          <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100/50 to-cyan-100/50">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-green-600 text-xs font-medium bg-green-100 px-2 py-1 rounded-full">
                +8.2%
              </div>
            </div>
            <h3 className="text-sm text-slate-500 mb-2">{t.admin.totalOrders || '总订单'}</h3>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {analytics?.total_orders || 0}
            </div>
            <p className="text-xs text-slate-400">
              {analytics?.pending_orders || 0} {t.admin.pendingOrders || '待处理订单'}
            </p>
          </div>
        </div>

        {/* Users Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
          <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-100/50 to-emerald-100/50">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-green-600 text-xs font-medium bg-green-100 px-2 py-1 rounded-full">
                +15.3%
              </div>
            </div>
            <h3 className="text-sm text-slate-500 mb-2">{t.admin.totalUsers || '总用户'}</h3>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {analytics?.total_users || 0}
            </div>
            <p className="text-xs text-slate-400">
              {analytics?.active_users || 0} {t.admin.activeUsers || '活跃用户'}
            </p>
          </div>
        </div>

        {/* Skills Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
          <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-100/50 to-red-100/50">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-green-600 text-xs font-medium bg-green-100 px-2 py-1 rounded-full">
                +20.1%
              </div>
            </div>
            <h3 className="text-sm text-slate-500 mb-2">{t.admin.totalSkills || '总技能'}</h3>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {analytics?.total_skills || 0}
            </div>
            <p className="text-xs text-slate-400">
              {analytics?.hot_skills || 0} {t.admin.hotSkills || '热门技能'}
            </p>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-20" />
        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 overflow-hidden">
          <div className="p-6 border-b border-slate-200/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{t.admin.recentOrders || '最近订单'}</h3>
                <p className="text-sm text-slate-500 mt-1">{t.admin.recentOrdersDesc || '最近的订单记录'}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100/50 to-purple-100/50">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="p-6">
            {analytics?.recent_orders && analytics.recent_orders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200/50 hover:bg-slate-100/20">
                    <TableHead className="text-slate-600 font-semibold">Order No</TableHead>
                    <TableHead className="text-slate-600 font-semibold">User Email</TableHead>
                    <TableHead className="text-slate-600 font-semibold">Amount</TableHead>
                    <TableHead className="text-slate-600 font-semibold">Status</TableHead>
                    <TableHead className="text-slate-600 font-semibold">Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.recent_orders.map((order: any) => (
                    <TableRow key={order.id} className="border-slate-200/30 hover:bg-slate-100/20 transition-colors">
                      <TableCell className="font-medium text-slate-900">{order.order_no}</TableCell>
                      <TableCell className="text-slate-600">{order.user_email}</TableCell>
                      <TableCell className="text-slate-900 font-semibold">${order.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          order.status === 'paid' ? 'default' : 'secondary'
                        } className={order.status === 'paid'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                        }>
                          {order.status === 'paid' ? (t.admin.statusPaid || '已支付') : (t.admin.statusPending || '待处理')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                {t.admin.noOrders || '暂无订单数据'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const SkillsContent = () => (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-20" />
        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 overflow-hidden">
          <div className="p-6 border-b border-slate-200/50">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100/50 to-cyan-100/50">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{t.admin.skillsManagement || '技能管理'}</h3>
                  <p className="text-sm text-slate-500">管理平台上的所有技能</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="搜索技能名称或描述..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9 w-64 bg-slate-100/50 border-slate-200/50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500/50"
                  />
                </div>
                <select
                  value={sortField || 'created_at'}
                  onChange={(e) => setSortField(e.target.value)}
                  className="px-3 py-2 bg-slate-100/50 border border-slate-200/50 rounded-lg text-sm text-slate-900 focus:border-blue-500/50 focus:outline-none"
                >
                  <option value="created_at" className="bg-white">创建时间</option>
                  <option value="name" className="bg-white">名称</option>
                  <option value="downloads_count" className="bg-white">下载量</option>
                  <option value="purchases_count" className="bg-white">购买量</option>
                  <option value="rating" className="bg-white">评分</option>
                  <option value="price" className="bg-white">价格</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="bg-slate-100/50 border-slate-200/50 text-slate-700 hover:bg-slate-200/50"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </div>
          <div className="p-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200/50 hover:bg-slate-100/20">
                  <TableHead
                    className="cursor-pointer hover:bg-slate-200/30 text-slate-600 font-semibold"
                    onClick={() => handleSort('name')}
                  >
                    Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="text-slate-600 font-semibold">Category</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-200/30 text-slate-600 font-semibold"
                    onClick={() => handleSort('price')}
                  >
                    Price {sortField === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="text-slate-600 font-semibold">Type</TableHead>
                  <TableHead className="text-slate-600 font-semibold">Status</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-200/30 text-slate-600 font-semibold"
                    onClick={() => handleSort('downloads_count')}
                  >
                    Downloads {sortField === 'downloads_count' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-200/30 text-slate-600 font-semibold"
                    onClick={() => handleSort('purchases_count')}
                  >
                    Purchases {sortField === 'purchases_count' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skills && skills.map((skill) => (
                  <TableRow key={skill.id} className="border-slate-200/30 hover:bg-slate-100/20 transition-colors">
                    <TableCell className="font-medium text-slate-900">{skill.name}</TableCell>
                    <TableCell className="text-slate-600">{skill.category?.name || '-'}</TableCell>
                    <TableCell className="text-slate-900 font-semibold">
                      {skill.price_type === 'free' ? 'Free' : `$${skill.price?.toFixed(2)}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={skill.price_type === 'paid' ? 'default' : 'secondary'} className={
                        skill.price_type === 'paid'
                          ? 'bg-blue-100 text-blue-700 border-blue-200'
                          : 'bg-slate-200 text-slate-600 border-slate-300'
                      }>
                        {skill.price_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={skill.is_active ? 'default' : 'outline'} className={
                        skill.is_active
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-red-100 text-red-700 border-red-200'
                      }>
                        {skill.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-900">{skill.downloads_count || 0}</TableCell>
                    <TableCell className="text-slate-900 font-semibold">{skill.purchases_count || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pagination.total > 0 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200/50">
                <span className="text-sm text-slate-500">
                  共 {pagination.total} 条记录，第 {pagination.page} 页 / 共 {Math.ceil(pagination.total / pagination.pageSize)} 页
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchData(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="bg-slate-100/50 border-slate-200/50 text-slate-700 hover:bg-slate-200/50 disabled:opacity-50"
                  >
                    上一页
                  </Button>
                  <span className="text-sm text-slate-600 px-3">
                    {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchData(pagination.page + 1)}
                    disabled={pagination.page * pagination.pageSize >= pagination.total}
                    className="bg-slate-100/50 border-slate-200/50 text-slate-700 hover:bg-slate-200/50 disabled:opacity-50"
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const UsersContent = () => (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-20" />
        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 overflow-hidden">
          <div className="p-6 border-b border-slate-200/50">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100/50 to-cyan-100/50">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{t.admin.usersManagement || '用户管理'}</h3>
                  <p className="text-sm text-slate-500">管理平台用户</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="搜索邮箱、用户名或姓名..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9 w-64 bg-slate-100/50 border-slate-200/50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500/50"
                  />
                </div>
                <select
                  value={sortField || 'created_at'}
                  onChange={(e) => setSortField(e.target.value)}
                  className="px-3 py-2 bg-slate-100/50 border border-slate-200/50 rounded-lg text-sm text-slate-900 focus:border-blue-500/50 focus:outline-none"
                >
                  <option value="created_at" className="bg-white">创建时间</option>
                  <option value="email" className="bg-white">邮箱</option>
                  <option value="username" className="bg-white">用户名</option>
                  <option value="name" className="bg-white">姓名</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="bg-slate-100/50 border-slate-200/50 text-slate-700 hover:bg-slate-200/50"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </div>
          <div className="p-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200/50 hover:bg-slate-100/20">
                  <TableHead
                    className="cursor-pointer hover:bg-slate-200/30 text-slate-600 font-semibold"
                    onClick={() => handleSort('email')}
                  >
                    Email {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-200/30 text-slate-600 font-semibold"
                    onClick={() => handleSort('username')}
                  >
                    Username {sortField === 'username' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-200/30 text-slate-600 font-semibold"
                    onClick={() => handleSort('name')}
                  >
                    Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-200/30 text-slate-600 font-semibold"
                    onClick={() => handleSort('role')}
                  >
                    Role {sortField === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-200/30 text-slate-600 font-semibold"
                    onClick={() => handleSort('is_active')}
                  >
                    Status {sortField === 'is_active' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-200/30 text-slate-600 font-semibold"
                    onClick={() => handleSort('created_at')}
                  >
                    Created At {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.map((user) => (
                  <TableRow key={user.id} className="border-slate-200/30 hover:bg-slate-100/20 transition-colors">
                    <TableCell className="font-medium text-slate-900">{user.email}</TableCell>
                    <TableCell className="text-slate-600">{user.username || '-'}</TableCell>
                    <TableCell className="text-slate-600">{user.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={
                        user.role === 'admin'
                          ? 'bg-blue-100 text-blue-700 border-blue-200'
                          : 'bg-slate-200 text-slate-600 border-slate-300'
                      }>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'outline'} className={
                        user.is_active
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-red-100 text-red-700 border-red-200'
                      }>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pagination.total > 0 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200/50">
                <span className="text-sm text-slate-500">
                  共 {pagination.total} 条记录，第 {pagination.page} 页 / 共 {Math.ceil(pagination.total / pagination.pageSize)} 页
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchData(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="bg-slate-100/50 border-slate-200/50 text-slate-700 hover:bg-slate-200/50 disabled:opacity-50"
                  >
                    上一页
                  </Button>
                  <span className="text-sm text-slate-600 px-3">
                    {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchData(pagination.page + 1)}
                    disabled={pagination.page * pagination.pageSize >= pagination.total}
                    className="bg-slate-100/50 border-slate-200/50 text-slate-700 hover:bg-slate-200/50 disabled:opacity-50"
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const OrdersContent = () => (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-20" />
        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 overflow-hidden">
          <div className="p-6 border-b border-slate-200/50">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100/50 to-cyan-100/50">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{t.admin.ordersManagement || '订单管理'}</h3>
                  <p className="text-sm text-slate-500">管理所有订单</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="搜索订单号或用户邮箱..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9 w-64 bg-slate-100/50 border-slate-200/50 text-slate-900 placeholder:text-slate-400 focus:border-blue-500/50"
                  />
                </div>
                <select
                  value={sortField || 'created_at'}
                  onChange={(e) => setSortField(e.target.value)}
                  className="px-3 py-2 bg-slate-100/50 border border-slate-200/50 rounded-lg text-sm text-slate-900 focus:border-blue-500/50 focus:outline-none"
                >
                  <option value="created_at" className="bg-white">创建时间</option>
                  <option value="order_no" className="bg-white">订单号</option>
                  <option value="total_amount" className="bg-white">金额</option>
                  <option value="status" className="bg-white">状态</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="bg-slate-100/50 border-slate-200/50 text-slate-700 hover:bg-slate-200/50"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </div>
          <div className="p-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200/50 hover:bg-slate-100/20">
                  <TableHead
                    className="cursor-pointer hover:bg-slate-200/30 text-slate-600 font-semibold"
                    onClick={() => handleSort('order_no')}
                  >
                    Order No {sortField === 'order_no' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-200/30 text-slate-600 font-semibold"
                    onClick={() => handleSort('user_email')}
                  >
                    User Email {sortField === 'user_email' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-200/30 text-slate-600 font-semibold"
                    onClick={() => handleSort('total_amount')}
                  >
                    Amount {sortField === 'total_amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-200/30 text-slate-600 font-semibold"
                    onClick={() => handleSort('status')}
                  >
                    Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-slate-200/30 text-slate-600 font-semibold"
                    onClick={() => handleSort('created_at')}
                  >
                    Created At {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders && orders.map((order) => (
                  <TableRow key={order.id} className="border-slate-200/30 hover:bg-slate-100/20 transition-colors">
                    <TableCell className="font-medium text-slate-900">{order.order_no}</TableCell>
                    <TableCell className="text-slate-600">{order.user?.email || order.user_email || '-'}</TableCell>
                    <TableCell className="text-slate-900 font-semibold">${order.total_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'paid' ? 'default' : 'secondary'} className={
                        order.status === 'paid'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                      }>
                        {order.status === 'paid' ? (t.admin.statusPaid || '已支付') : (t.admin.statusPending || '待处理')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pagination.total > 0 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200/50">
                <span className="text-sm text-slate-500">
                  共 {pagination.total} 条记录，第 {pagination.page} 页 / 共 {Math.ceil(pagination.total / pagination.pageSize)} 页
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchData(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="bg-slate-100/50 border-slate-200/50 text-slate-700 hover:bg-slate-200/50 disabled:opacity-50"
                  >
                    上一页
                  </Button>
                  <span className="text-sm text-slate-600 px-3">
                    {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchData(pagination.page + 1)}
                    disabled={pagination.page * pagination.pageSize >= pagination.total}
                    className="bg-slate-100/50 border-slate-200/50 text-slate-700 hover:bg-slate-200/50 disabled:opacity-50"
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const AnalyticsContent = () => (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur opacity-20" />
        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 overflow-hidden">
          <div className="p-6 border-b border-slate-200/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{t.admin.analytics || '数据分析'}</h3>
                <p className="text-sm text-slate-500 mt-1">平台详细数据统计和分析</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100/50 to-purple-100/50">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="text-center py-12 text-slate-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              分析页面正在开发中，即将推出更多图表和报告
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewContent />
      case 'skills':
        return <SkillsContent />
      case 'users':
        return <UsersContent />
      case 'orders':
        return <OrdersContent />
      case 'analytics':
        return <AnalyticsContent />
      default:
        return <OverviewContent />
    }
  }

  if (loading && activeTab === 'overview') {
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

  return renderContent()
}