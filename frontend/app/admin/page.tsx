"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import api, { authApi, type User, type Order, type Analytics, type Skill } from "@/lib/api"
import { Users, DollarSign, ShoppingCart, TrendingUp, Search, Edit, Eye } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"
import { useUser } from "@/contexts/user-context"

export default function AdminDashboard() {
  const { t } = useI18n()
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'users' | 'orders'>('overview')
  const [loading, setLoading] = useState(true)
  const [skills, setSkills] = useState<Skill[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 })
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

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
          setAnalytics(analyticsRes.data)
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
    if (activeTab !== 'overview') {
      const timer = setTimeout(() => {
        fetchData(1)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [searchTerm, sortField, sortOrder])

  const OverviewContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.admin.totalRevenue}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.total_revenue ? `$${analytics.total_revenue.toFixed(2)}` : '$0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.today_orders || 0} {t.admin.todayOrders}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.admin.totalOrders}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_orders || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.pending_orders || 0} {t.admin.pendingOrders}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.admin.totalUsers}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.active_users || 0} {t.admin.activeUsers}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t.admin.totalSkills}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_skills || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.hot_skills || 0} {t.admin.hotSkills}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.admin.recentOrders}</CardTitle>
          <CardDescription>{t.admin.recentOrdersDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics?.recent_orders && analytics.recent_orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order No</TableHead>
                  <TableHead>User Email</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.recent_orders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_no}</TableCell>
                    <TableCell>{order.user_email}</TableCell>
                    <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        order.status === 'paid' ? 'default' : 'secondary'
                      }>
                        {order.status === 'paid' ? t.admin.statusPaid : t.admin.statusPending}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t.admin.noOrders}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const SkillsContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{t.admin.skillsManagement}</CardTitle>
              <CardDescription>管理平台上的所有技能</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索技能名称或描述..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <select
                value={sortField || 'created_at'}
                onChange={(e) => setSortField(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="created_at">创建时间</option>
                <option value="name">名称</option>
                <option value="downloads_count">下载量</option>
                <option value="purchases_count">购买量</option>
                <option value="rating">评分</option>
                <option value="price">价格</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('name')}
                >
                  Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('price')}
                >
                  Price {sortField === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('downloads_count')}
                >
                  Downloads {sortField === 'downloads_count' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('purchases_count')}
                >
                  Purchases {sortField === 'purchases_count' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {skills && skills.map((skill) => (
                <TableRow key={skill.id}>
                  <TableCell className="font-medium">{skill.name}</TableCell>
                  <TableCell>{skill.category?.name || '-'}</TableCell>
                  <TableCell>
                    {skill.price_type === 'free' ? 'Free' : `$${skill.price?.toFixed(2)}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={skill.price_type === 'paid' ? 'default' : 'secondary'}>
                      {skill.price_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={skill.is_active ? 'default' : 'outline'}>
                      {skill.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>{skill.downloads_count || 0}</TableCell>
                  <TableCell>{skill.purchases_count || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pagination.total > 0 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                共 {pagination.total} 条记录，第 {pagination.page} 页 / 共 {Math.ceil(pagination.total / pagination.pageSize)} 页
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  上一页
                </Button>
                <span className="text-sm">
                  {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData(pagination.page + 1)}
                  disabled={pagination.page * pagination.pageSize >= pagination.total}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const UsersContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{t.admin.usersManagement}</CardTitle>
              <CardDescription>管理平台用户</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索邮箱、用户名或姓名..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <select
                value={sortField || 'created_at'}
                onChange={(e) => setSortField(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="created_at">创建时间</option>
                <option value="email">邮箱</option>
                <option value="username">用户名</option>
                <option value="name">姓名</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('email')}
                >
                  Email {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('username')}
                >
                  Username {sortField === 'username' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('name')}
                >
                  Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('role')}
                >
                  Role {sortField === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('is_active')}
                >
                  Status {sortField === 'is_active' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('created_at')}
                >
                  Created At {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users && users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.username || '-'}</TableCell>
                  <TableCell>{user.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'outline'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pagination.total > 0 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                共 {pagination.total} 条记录，第 {pagination.page} 页 / 共 {Math.ceil(pagination.total / pagination.pageSize)} 页
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  上一页
                </Button>
                <span className="text-sm">
                  {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData(pagination.page + 1)}
                  disabled={pagination.page * pagination.pageSize >= pagination.total}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const OrdersContent = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{t.admin.ordersManagement}</CardTitle>
              <CardDescription>管理所有订单</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索订单号或用户邮箱..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <select
                value={sortField || 'created_at'}
                onChange={(e) => setSortField(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="created_at">创建时间</option>
                <option value="order_no">订单号</option>
                <option value="total_amount">金额</option>
                <option value="status">状态</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('order_no')}
                >
                  Order No {sortField === 'order_no' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('user_email')}
                >
                  User Email {sortField === 'user_email' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('total_amount')}
                >
                  Amount {sortField === 'total_amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('status')}
                >
                  Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => handleSort('created_at')}
                >
                  Created At {sortField === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders && orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_no}</TableCell>
                  <TableCell>{order.user?.email || order.user_email || '-'}</TableCell>
                  <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={order.status === 'paid' ? 'default' : 'secondary'}>
                      {order.status === 'paid' ? t.admin.statusPaid : t.admin.statusPending}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {pagination.total > 0 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">
                共 {pagination.total} 条记录，第 {pagination.page} 页 / 共 {Math.ceil(pagination.total / pagination.pageSize)} 页
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  上一页
                </Button>
                <span className="text-sm">
                  {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchData(pagination.page + 1)}
                  disabled={pagination.page * pagination.pageSize >= pagination.total}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">{t.admin.dashboardTitle}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-white/60 backdrop-blur-sm border-slate-200">
        <div className="container mx-auto px-4">
          <div className="flex space-x-4 py-2">
            {[
              { id: 'overview', label: t.admin.overview },
              { id: 'skills', label: t.admin.skillsManagement },
              { id: 'users', label: t.admin.usersManagement },
              { id: 'orders', label: t.admin.ordersManagement },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-600">{t.home.loading}</div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewContent />}
            {activeTab === 'skills' && <SkillsContent />}
            {activeTab === 'users' && <UsersContent />}
            {activeTab === 'orders' && <OrdersContent />}
          </>
        )}
      </div>
    </div>
  )
}
