"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useUser } from "@/contexts/user-context"
import { useI18n } from "@/contexts/i18n-context"
import { authApi } from "@/lib/api"
import {
  Lock,
  Shield,
  Key,
  Unlink,
  Github,
  Globe,
  Mail,
  Smartphone,
  Calendar,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  LogOut,
  Clock,
  UserX
} from "lucide-react"
import { format } from "date-fns"
import { zhCN, enUS } from "date-fns/locale"

// 密码修改表单验证模式
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "请输入当前密码"),
  newPassword: z.string().min(6, "新密码至少6个字符"),
  confirmPassword: z.string().min(1, "请确认新密码"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
})

type PasswordFormData = z.infer<typeof passwordSchema>

// OAuth账号信息
interface OAuthAccount {
  provider: string
  provider_user_id: string
  created_at: string
  updated_at: string
}

// 登录历史记录（模拟数据）
interface LoginHistory {
  id: string
  timestamp: string
  ip: string
  location: string
  device: string
  status: 'success' | 'failed'
}

export default function SecurityPage() {
  const { user, logout } = useUser()
  const { t, locale } = useI18n()
  const [activeTab, setActiveTab] = useState("password")
  const [loading, setLoading] = useState(false)
  const [oauthAccounts, setOauthAccounts] = useState<OAuthAccount[]>([])
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([])
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [unbinding, setUnbinding] = useState<string | null>(null)
  const [unbindError, setUnbindError] = useState<string | null>(null)
  const [unbindSuccess, setUnbindSuccess] = useState<string | null>(null)

  // 密码修改表单
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  })

  // 加载OAuth账号和登录历史
  useEffect(() => {
    const loadSecurityData = async () => {
      if (!user) return

      setLoading(true)
      try {
        // 加载OAuth账号
        const accounts = await authApi.getOAuthAccounts()
        setOauthAccounts(accounts)

        // 模拟登录历史数据
        setLoginHistory([
          {
            id: "1",
            timestamp: new Date().toISOString(),
            ip: "192.168.1.100",
            location: "中国，北京",
            device: "Chrome on macOS",
            status: 'success'
          },
          {
            id: "2",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            ip: "192.168.1.101",
            location: "中国，上海",
            device: "Safari on iPhone",
            status: 'success'
          },
          {
            id: "3",
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            ip: "203.0.113.1",
            location: "美国，加州",
            device: "Firefox on Windows",
            status: 'failed'
          },
        ])
      } catch (err) {
        console.error("Failed to load security data:", err)
      } finally {
        setLoading(false)
      }
    }

    loadSecurityData()
  }, [user])

  // 处理密码修改
  const handlePasswordChange = async (data: PasswordFormData) => {
    setPasswordSuccess(false)
    setPasswordError(null)

    try {
      await authApi.changePassword(data.currentPassword, data.newPassword)
      setPasswordSuccess(true)
      passwordForm.reset()

      // 3秒后隐藏成功消息
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err: any) {
      console.error("Failed to change password:", err)
      setPasswordError(err.response?.data?.error || "修改密码失败，请重试")
    }
  }

  // 处理OAuth账号解绑
  const handleUnbindOAuth = async (provider: string) => {
    setUnbinding(provider)
    setUnbindError(null)
    setUnbindSuccess(null)

    try {
      await authApi.unbindOAuthAccount(provider)
      setUnbindSuccess(`${provider}账号解绑成功`)
      setOauthAccounts(oauthAccounts.filter(acc => acc.provider !== provider))

      // 3秒后隐藏成功消息
      setTimeout(() => setUnbindSuccess(null), 3000)
    } catch (err: any) {
      console.error(`Failed to unbind ${provider}:`, err)
      setUnbindError(err.response?.data?.error || `解绑${provider}账号失败`)
    } finally {
      setUnbinding(null)
    }
  }

  // 获取提供商显示名称
  const getProviderName = (provider: string) => {
    const providers: Record<string, string> = {
      github: "GitHub",
      google: "Google",
      wechat: "微信",
      feishu: "飞书",
      xiaohongshu: "小红书",
    }
    return providers[provider] || provider
  }

  // 获取提供商图标
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'github':
        return <Github className="h-5 w-5" />
      case 'google':
        return <Globe className="h-5 w-5" />
      case 'wechat':
        return <Smartphone className="h-5 w-5" />
      case 'feishu':
        return <Mail className="h-5 w-5" />
      case 'xiaohongshu':
        return <Calendar className="h-5 w-5" />
      default:
        return <Globe className="h-5 w-5" />
    }
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

  if (loading && oauthAccounts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-slate-600">加载安全设置...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {t.dashboard?.nav?.security || "账户安全"}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {t.dashboard?.nav?.securityDesc || "密码和第三方账号管理"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="password">
            <Key className="h-4 w-4 mr-2" />
            密码安全
          </TabsTrigger>
          <TabsTrigger value="oauth">
            <Unlink className="h-4 w-4 mr-2" />
            第三方账号
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            登录历史
          </TabsTrigger>
        </TabsList>

        {/* 密码安全选项卡 */}
        <TabsContent value="password" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                修改密码
              </CardTitle>
              <CardDescription>
                定期修改密码可以提高账户安全性
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                  {/* 提示信息 */}
                  {passwordSuccess && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertTitle className="text-green-800 dark:text-green-300">密码修改成功</AlertTitle>
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        您的密码已成功更新，请使用新密码登录
                      </AlertDescription>
                    </Alert>
                  )}

                  {passwordError && (
                    <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <AlertTitle className="text-red-800 dark:text-red-300">密码修改失败</AlertTitle>
                      <AlertDescription className="text-red-700 dark:text-red-400">
                        {passwordError}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* 当前密码 */}
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>当前密码</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showCurrentPassword ? "text" : "password"}
                              placeholder="请输入当前密码"
                              {...field}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 新密码 */}
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>新密码</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              placeholder="请输入新密码（至少6位）"
                              {...field}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <FormDescription>
                          密码至少6个字符，建议包含字母、数字和特殊字符
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 确认新密码 */}
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>确认新密码</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="请再次输入新密码"
                              {...field}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={passwordForm.formState.isSubmitting}
                  >
                    {passwordForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        修改中...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        修改密码
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <Shield className="h-4 w-4 inline mr-1" />
                安全提示：建议每3个月修改一次密码，不要使用与其他网站相同的密码
              </div>
            </CardFooter>
          </Card>

          {/* 密码强度提示 */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-300">
                密码安全建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  使用至少8个字符的密码
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  混合使用大写字母、小写字母、数字和特殊字符
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  避免使用个人信息（如生日、姓名）作为密码
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  不要在不同网站使用相同的密码
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  考虑使用密码管理器来管理复杂密码
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 第三方账号选项卡 */}
        <TabsContent value="oauth" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Unlink className="h-5 w-5 mr-2" />
                第三方账号绑定
              </CardTitle>
              <CardDescription>
                绑定第三方账号可以快速登录，提高便利性
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 提示信息 */}
              {unbindSuccess && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20 mb-4">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-800 dark:text-green-300">解绑成功</AlertTitle>
                  <AlertDescription className="text-green-700 dark:text-green-400">
                    {unbindSuccess}
                  </AlertDescription>
                </Alert>
              )}

              {unbindError && (
                <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20 mb-4">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertTitle className="text-red-800 dark:text-red-300">解绑失败</AlertTitle>
                  <AlertDescription className="text-red-700 dark:text-red-400">
                    {unbindError}
                  </AlertDescription>
                </Alert>
              )}

              {oauthAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <UserX className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                    未绑定第三方账号
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    您还没有绑定任何第三方账号，绑定后可以快速登录
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {oauthAccounts.map((account) => (
                    <div
                      key={account.provider}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          {getProviderIcon(account.provider)}
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">
                            {getProviderName(account.provider)}
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            ID: {account.provider_user_id}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            绑定时间: {formatDate(account.created_at)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnbindOAuth(account.provider)}
                        disabled={unbinding === account.provider}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        {unbinding === account.provider ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Unlink className="h-4 w-4 mr-1" />
                            解绑
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                注意：如果您没有设置密码，必须至少保留一个第三方账号绑定
              </div>
            </CardFooter>
          </Card>

          {/* 可绑定的第三方账号 */}
          <Card>
            <CardHeader>
              <CardTitle>可绑定的第三方账号</CardTitle>
              <CardDescription>
                点击绑定按钮，跳转到第三方授权页面
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {['github', 'google', 'wechat', 'feishu', 'xiaohongshu'].map((provider) => {
                  const isBound = oauthAccounts.some(acc => acc.provider === provider)
                  return (
                    <div
                      key={provider}
                      className={`p-4 rounded-lg border ${
                        isBound
                          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            isBound
                              ? 'bg-green-100 dark:bg-green-900/30'
                              : 'bg-slate-100 dark:bg-slate-800'
                          }`}>
                            {getProviderIcon(provider)}
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900 dark:text-slate-100">
                              {getProviderName(provider)}
                            </h4>
                            <Badge
                              variant={isBound ? "default" : "outline"}
                              className={`mt-1 ${
                                isBound
                                  ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                                  : ''
                              }`}
                            >
                              {isBound ? '已绑定' : '未绑定'}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant={isBound ? "outline" : "default"}
                          size="sm"
                          disabled={isBound}
                          className={isBound ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          {isBound ? '已绑定' : '绑定'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 登录历史选项卡 */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                登录历史
              </CardTitle>
              <CardDescription>
                查看最近的登录记录，确保账户安全
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loginHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                    暂无登录记录
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    登录记录将在您登录后显示
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {loginHistory.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          record.status === 'success'
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-red-100 dark:bg-red-900/30'
                        }`}>
                          {record.status === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-900 dark:text-slate-100">
                              {record.location}
                            </h4>
                            <Badge
                              variant={record.status === 'success' ? "default" : "destructive"}
                              className="text-xs"
                            >
                              {record.status === 'success' ? '成功' : '失败'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {record.device}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              <MapPin className="h-3 w-3 inline mr-1" />
                              IP: {record.ip}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {formatDate(record.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {record.status === 'failed' && (
                        <Button variant="outline" size="sm">
                          报告异常
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                如果发现异常的登录记录，请立即修改密码并联系客服
              </div>
            </CardFooter>
          </Card>

          {/* 安全建议 */}
          <Card className="border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-300">
                账户安全建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-orange-700 dark:text-orange-400">
                <li className="flex items-start">
                  <Shield className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  定期检查登录记录，确保没有异常登录
                </li>
                <li className="flex items-start">
                  <Shield className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  如果发现可疑登录，立即修改密码并退出所有设备
                </li>
                <li className="flex items-start">
                  <Shield className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  启用双重认证（即将推出）
                </li>
                <li className="flex items-start">
                  <Shield className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  不要在公共设备上保持登录状态
                </li>
                <li className="flex items-start">
                  <Shield className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  使用强密码并定期更换
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => {
                  if (confirm("确定要退出所有设备吗？这将在所有设备上退出登录。")) {
                    logout()
                  }
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                退出所有设备
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}