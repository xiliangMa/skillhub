"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { api, type User, type Order, type Analytics } from "@/lib/api"
import { Users, DollarSign, ShoppingCart, TrendingUp } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"

export default function AdminDashboard() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'users' | 'orders'>('overview')
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [analyticsRes] = await Promise.all([
        api.get('/admin/analytics'),
      ])
      setAnalytics(analyticsRes.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">{t.admin.dashboardTitle}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
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
                    ? 'text-foreground border-b-2 border-foreground'
                    : 'text-muted-foreground hover:text-foreground'
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
            <div className="text-muted-foreground">{t.home.loading}</div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && <OverviewContent />}
            {activeTab === 'skills' && (
              <div className="text-center py-12 text-muted-foreground">
                {t.admin.skillsManagement} coming soon...
              </div>
            )}
            {activeTab === 'users' && (
              <div className="text-center py-12 text-muted-foreground">
                {t.admin.usersManagement} coming soon...
              </div>
            )}
            {activeTab === 'orders' && (
              <div className="text-center py-12 text-muted-foreground">
                {t.admin.ordersManagement} coming soon...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
