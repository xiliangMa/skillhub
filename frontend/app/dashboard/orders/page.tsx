"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser } from "@/contexts/user-context"
import { useI18n } from "@/contexts/i18n-context"
import { paymentApi, Order } from "@/lib/api"
import {
  ShoppingCart,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  CreditCard,
  Package,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  ExternalLink
} from "lucide-react"
import { format } from "date-fns"
import { zhCN, enUS } from "date-fns/locale"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"

// 订单状态映射
const ORDER_STATUS = {
  pending: { label: "待支付", color: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800" },
  paid: { label: "已支付", color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800" },
  cancelled: { label: "已取消", color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800" },
  refunded: { label: "已退款", color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
}

// 支付方式映射
const PAYMENT_METHODS = {
  alipay: "支付宝",
  wechat: "微信支付",
  stripe: "Stripe",
  paypal: "PayPal",
  mock: "模拟支付",
  unknown: "未知",
}

export default function OrdersPage() {
  const { user } = useUser()
  const { t, locale } = useI18n()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const pageSize = 10

  // 获取订单数据
  const fetchOrders = async (page: number = 1) => {
    if (!user) return

    setLoading(true)
    setError(null)
    try {
      const response = await paymentApi.getOrders({
        page,
        page_size: pageSize,
      })

      setOrders(response.data?.list || [])
      setTotalOrders(response.data?.total || 0)
      setTotalPages(Math.ceil((response.data?.total || 0) / pageSize))
    } catch (err: any) {
      console.error("Failed to fetch orders:", err)
      setError(err.response?.data?.error || "获取订单失败")
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  // 初始加载和用户变化时获取数据
  useEffect(() => {
    if (user) {
      fetchOrders(currentPage)
    }
  }, [user, currentPage])

  // 处理搜索和筛选
  const filteredOrders = orders.filter(order => {
    // 搜索过滤（订单号、技能名称）
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesOrderNo = order.order_no.toLowerCase().includes(query)
      // 注意：这里需要技能名称，但当前API可能不包含，暂时只匹配订单号
      if (!matchesOrderNo) {
        return false
      }
    }

    // 状态过滤
    if (statusFilter !== "all" && order.status !== statusFilter) {
      return false
    }

    // 时间过滤（简化处理）
    if (dateFilter !== "all") {
      const orderDate = new Date(order.created_at)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24))

      if (dateFilter === "today" && diffDays > 0) return false
      if (dateFilter === "week" && diffDays > 7) return false
      if (dateFilter === "month" && diffDays > 30) return false
      if (dateFilter === "year" && diffDays > 365) return false
    }

    return true
  })

  // 处理分页
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const dateLocale = locale === "zh" ? zhCN : enUS
      return format(date, "yyyy-MM-dd HH:mm", { locale: dateLocale })
    } catch (e) {
      return dateString
    }
  }

  // 获取订单状态显示
  const getStatusInfo = (status: string) => {
    return ORDER_STATUS[status as keyof typeof ORDER_STATUS] ||
           { label: status, color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800" }
  }

  // 获取支付方式显示
  const getPaymentMethod = (method: string) => {
    return PAYMENT_METHODS[method as keyof typeof PAYMENT_METHODS] || method || "未知"
  }

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-6">
        {/* 页面标题 */}
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>

        {/* 筛选区域 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>

        {/* 订单列表 */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {t.dashboard?.nav?.orders || "购买历史"}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {t.dashboard?.nav?.ordersDesc || "查看订单和下载记录"}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">总订单数</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {totalOrders}
                </p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">已支付</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {orders.filter(o => o.status === 'paid').length}
                </p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">待支付</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {orders.filter(o => o.status === 'pending').length}
                </p>
              </div>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">已取消</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {orders.filter(o => o.status === 'cancelled').length}
                </p>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和搜索区域 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="搜索订单号..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* 状态筛选 */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="paid">已支付</SelectItem>
                <SelectItem value="pending">待支付</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
                <SelectItem value="refunded">已退款</SelectItem>
              </SelectContent>
            </Select>

            {/* 时间筛选 */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="时间" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部时间</SelectItem>
                <SelectItem value="today">今天</SelectItem>
                <SelectItem value="week">最近一周</SelectItem>
                <SelectItem value="month">最近一月</SelectItem>
                <SelectItem value="year">最近一年</SelectItem>
              </SelectContent>
            </Select>

            {/* 刷新按钮 */}
            <Button
              variant="outline"
              onClick={() => fetchOrders(currentPage)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">获取订单失败</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 订单列表 */}
      {filteredOrders.length === 0 && !loading ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="mx-auto max-w-md">
              <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <ShoppingCart className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                暂无订单记录
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {searchQuery || statusFilter !== "all" || dateFilter !== "all"
                  ? "没有找到匹配的订单，请尝试其他筛选条件"
                  : "您还没有购买过任何技能，快去探索吧！"}
              </p>
              <Button
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setDateFilter("all")
                }}
                variant="outline"
                className="mr-3"
              >
                清除筛选
              </Button>
              <Button>
                <Package className="h-4 w-4 mr-2" />
                浏览技能
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusInfo(order.status)
            return (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* 订单基本信息 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                        <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                          #{order.order_no}
                        </span>
                        {order.paid_at && (
                          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(order.paid_at)}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">订单金额</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            ¥{order.total_amount.toFixed(2)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">支付方式</p>
                          <div className="flex items-center mt-1">
                            <CreditCard className="h-4 w-4 mr-2 text-slate-400" />
                            <span className="text-slate-900 dark:text-slate-100">
                              {getPaymentMethod(order.payment_method)}
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">下单时间</p>
                          <div className="flex items-center mt-1">
                            <Clock className="h-4 w-4 mr-2 text-slate-400" />
                            <span className="text-slate-900 dark:text-slate-100">
                              {formatDate(order.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        查看详情
                      </Button>

                      {order.status === 'paid' && (
                        <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                          <Download className="h-4 w-4 mr-1" />
                          下载
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>订单操作</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            查看发票
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            联系客服
                          </DropdownMenuItem>
                          {order.status === 'pending' && (
                            <DropdownMenuItem className="text-red-600 dark:text-red-400">
                              <XCircle className="h-4 w-4 mr-2" />
                              取消订单
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalOrders)} 条，
                共 {totalOrders} 条订单
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 帮助提示 */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                订单问题帮助
              </h4>
              <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <li>• <strong>待支付订单</strong>：请在30分钟内完成支付，超时订单将自动取消</li>
                <li>• <strong>已支付订单</strong>：点击"下载"按钮获取技能包文件</li>
                <li>• <strong>订单问题</strong>：如有任何问题，请联系客服或发送邮件至 support@skillhub.com</li>
                <li>• <strong>发票申请</strong>：已支付订单可申请电子发票，请在订单详情中操作</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}