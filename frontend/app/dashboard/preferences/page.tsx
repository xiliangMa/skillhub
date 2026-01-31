"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/contexts/user-context"
import { useI18n } from "@/contexts/i18n-context"
import { authApi } from "@/lib/api"
import {
  Settings,
  Globe,
  Moon,
  Sun,
  Bell,
  Shield,
  Eye,
  Search,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Grid3x3,
  List,
  Download,
  User
} from "lucide-react"

// 偏好设置类型
interface Preferences {
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
}

export default function PreferencesPage() {
  const { user } = useUser()
  const { t, locale, setLocale, toggleLanguage } = useI18n()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("general")

  // 偏好设置状态
  const [preferences, setPreferences] = useState<Preferences>({
    language: "zh",
    theme: "dark",
    notifications: {
      email: true,
      in_app: true,
      marketing: false,
    },
    privacy: {
      profile_public: true,
      analytics_opt_in: true,
    },
    display: {
      view_mode: "grid",
      items_per_page: 20,
    },
    search: {
      save_history: true,
      personalized: true,
    },
  })

  // 加载偏好设置
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return

      setLoading(true)
      try {
        const data = await authApi.getPreferences()
        setPreferences(data)
      } catch (err) {
        console.error("Failed to load preferences:", err)
        // 使用默认设置
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [user])

  // 保存偏好设置
  const savePreferences = async () => {
    if (!user) return

    setSaving(true)
    setSuccess(false)
    setError(null)

    try {
      await authApi.updatePreferences(preferences)
      setSuccess(true)

      // 应用语言设置
      if (preferences.language !== locale) {
        setLocale(preferences.language as "zh" | "en")
      }

      // 3秒后隐藏成功消息
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error("Failed to save preferences:", err)
      setError(err.response?.data?.error || "保存设置失败，请重试")
    } finally {
      setSaving(false)
    }
  }

  // 重置为默认设置
  const resetToDefaults = () => {
    if (confirm("确定要重置所有设置为默认值吗？")) {
      setPreferences({
        language: "zh",
        theme: "dark",
        notifications: {
          email: true,
          in_app: true,
          marketing: false,
        },
        privacy: {
          profile_public: true,
          analytics_opt_in: true,
        },
        display: {
          view_mode: "grid",
          items_per_page: 20,
        },
        search: {
          save_history: true,
          personalized: true,
        },
      })
    }
  }

  // 处理偏好设置更新
  const updatePreference = <K extends keyof Preferences>(category: K, key: keyof Preferences[K], value: any) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-slate-600">加载偏好设置...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {t.dashboard?.nav?.preferences || "偏好设置"}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {t.dashboard?.nav?.preferencesDesc || "语言、主题和通知设置"}
        </p>
      </div>

      {/* 提示信息 */}
      {success && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-300">保存成功</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            偏好设置已成功更新
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-red-800 dark:text-red-300">保存失败</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-400">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            通用
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            通知
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="h-4 w-4 mr-2" />
            隐私
          </TabsTrigger>
          <TabsTrigger value="display">
            <Eye className="h-4 w-4 mr-2" />
            显示
          </TabsTrigger>
        </TabsList>

        {/* 通用设置选项卡 */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>通用设置</CardTitle>
              <CardDescription>
                配置应用程序的基本偏好
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 语言设置 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      语言
                    </Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      选择应用程序显示语言
                    </p>
                  </div>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) => updatePreference("language", "language", value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="选择语言" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* 主题设置 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center">
                      {preferences.theme === "dark" ? (
                        <Moon className="h-4 w-4 mr-2" />
                      ) : (
                        <Sun className="h-4 w-4 mr-2" />
                      )}
                      主题
                    </Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      选择应用程序颜色主题
                    </p>
                  </div>
                  <Select
                    value={preferences.theme}
                    onValueChange={(value) => updatePreference("theme", "theme", value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="选择主题" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center">
                          <Sun className="h-4 w-4 mr-2" />
                          浅色主题
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center">
                          <Moon className="h-4 w-4 mr-2" />
                          深色主题
                        </div>
                      </SelectItem>
                      <SelectItem value="auto">
                        <div className="flex items-center">
                          <Settings className="h-4 w-4 mr-2" />
                          跟随系统
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 主题预览 */}
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      preferences.theme === "light"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                    onClick={() => updatePreference("theme", "theme", "light")}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Sun className="h-4 w-4 text-slate-600" />
                      {preferences.theme === "light" && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 bg-slate-200 rounded"></div>
                      <div className="h-2 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-2 bg-slate-200 rounded w-1/2"></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">浅色</p>
                  </div>

                  <div
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      preferences.theme === "dark"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                    onClick={() => updatePreference("theme", "theme", "dark")}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Moon className="h-4 w-4 text-slate-600" />
                      {preferences.theme === "dark" && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 bg-slate-800 rounded"></div>
                      <div className="h-2 bg-slate-800 rounded w-3/4"></div>
                      <div className="h-2 bg-slate-800 rounded w-1/2"></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">深色</p>
                  </div>

                  <div
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      preferences.theme === "auto"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                    onClick={() => updatePreference("theme", "theme", "auto")}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Settings className="h-4 w-4 text-slate-600" />
                      {preferences.theme === "auto" && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 bg-gradient-to-r from-slate-200 to-slate-800 rounded"></div>
                      <div className="h-2 bg-gradient-to-r from-slate-200 to-slate-800 rounded w-3/4"></div>
                      <div className="h-2 bg-gradient-to-r from-slate-200 to-slate-800 rounded w-1/2"></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">自动</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知设置选项卡 */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>通知设置</CardTitle>
              <CardDescription>
                管理您接收的通知类型
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 邮件通知 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center">
                    <Bell className="h-4 w-4 mr-2" />
                    邮件通知
                  </Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    接收订单状态、系统更新等重要邮件
                  </p>
                </div>
                <Switch
                  checked={preferences.notifications.email}
                  onCheckedChange={(checked) => updatePreference("notifications", "email", checked)}
                />
              </div>

              <Separator />

              {/* 站内通知 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">站内通知</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    在网站内接收消息和提醒
                  </p>
                </div>
                <Switch
                  checked={preferences.notifications.in_app}
                  onCheckedChange={(checked) => updatePreference("notifications", "in_app", checked)}
                />
              </div>

              <Separator />

              {/* 营销通知 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">营销通知</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    接收新产品、促销活动等营销信息
                  </p>
                </div>
                <Switch
                  checked={preferences.notifications.marketing}
                  onCheckedChange={(checked) => updatePreference("notifications", "marketing", checked)}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <Bell className="h-4 w-4 inline mr-1" />
                重要通知（如安全警报）将始终发送，不受此设置影响
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* 隐私设置选项卡 */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>隐私设置</CardTitle>
              <CardDescription>
                管理您的隐私偏好和数据共享
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 个人资料公开 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    公开个人资料
                  </Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    允许其他用户查看您的个人资料和已发布的技能
                  </p>
                </div>
                <Switch
                  checked={preferences.privacy.profile_public}
                  onCheckedChange={(checked) => updatePreference("privacy", "profile_public", checked)}
                />
              </div>

              <Separator />

              {/* 数据分析 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">数据分析许可</Label>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    允许我们收集匿名使用数据以改进产品
                  </p>
                </div>
                <Switch
                  checked={preferences.privacy.analytics_opt_in}
                  onCheckedChange={(checked) => updatePreference("privacy", "analytics_opt_in", checked)}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <Shield className="h-4 w-4 inline mr-1" />
                我们尊重您的隐私，所有数据收集都遵循我们的隐私政策
              </div>
            </CardFooter>
          </Card>

          {/* 数据管理 */}
          <Card>
            <CardHeader>
              <CardTitle>数据管理</CardTitle>
              <CardDescription>
                管理您的个人数据
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">导出个人数据</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  下载包含您所有个人数据的归档文件
                </p>
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  请求数据导出
                </Button>
              </div>

              <div className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">删除账户</h4>
                <p className="text-sm text-red-700 dark:text-red-400 mb-4">
                  永久删除您的账户和所有相关数据。此操作不可撤销。
                </p>
                <Button variant="outline" className="w-full text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
                  删除我的账户
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 显示设置选项卡 */}
        <TabsContent value="display" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>显示设置</CardTitle>
              <CardDescription>
                自定义应用程序的显示方式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 视图模式 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">默认视图模式</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      选择技能列表的默认显示方式
                    </p>
                  </div>
                  <Select
                    value={preferences.display.view_mode}
                    onValueChange={(value) => updatePreference("display", "view_mode", value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="选择视图模式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grid">
                        <div className="flex items-center">
                          <Grid3x3 className="h-4 w-4 mr-2" />
                          网格视图
                        </div>
                      </SelectItem>
                      <SelectItem value="list">
                        <div className="flex items-center">
                          <List className="h-4 w-4 mr-2" />
                          列表视图
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 视图模式预览 */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      preferences.display.view_mode === "grid"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                    onClick={() => updatePreference("display", "view_mode", "grid")}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Grid3x3 className="h-4 w-4 text-slate-600" />
                      {preferences.display.view_mode === "grid" && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-800 rounded"></div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">网格视图</p>
                  </div>

                  <div
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      preferences.display.view_mode === "list"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                    onClick={() => updatePreference("display", "view_mode", "list")}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <List className="h-4 w-4 text-slate-600" />
                      {preferences.display.view_mode === "list" && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="space-y-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">列表视图</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 每页显示数量 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">每页显示数量</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      设置列表页面每页显示的项目数量
                    </p>
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {preferences.display.items_per_page}
                  </div>
                </div>
                <Slider
                  value={[preferences.display.items_per_page]}
                  onValueChange={([value]) => updatePreference("display", "items_per_page", value)}
                  max={50}
                  min={10}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                  <span>10</span>
                  <span>25</span>
                  <span>50</span>
                </div>
              </div>

              <Separator />

              {/* 搜索设置 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base flex items-center">
                      <Search className="h-4 w-4 mr-2" />
                      保存搜索历史
                    </Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      保存您的搜索记录以便快速访问
                    </p>
                  </div>
                  <Switch
                    checked={preferences.search.save_history}
                    onCheckedChange={(checked) => updatePreference("search", "save_history", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">个性化搜索</Label>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      根据您的使用习惯提供个性化搜索结果
                    </p>
                  </div>
                  <Switch
                    checked={preferences.search.personalized}
                    onCheckedChange={(checked) => updatePreference("search", "personalized", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 操作按钮 */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
        <Button
          variant="outline"
          onClick={resetToDefaults}
          disabled={saving}
        >
          重置为默认设置
        </Button>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              // 重新加载当前设置
              const loadCurrent = async () => {
                try {
                  const data = await authApi.getPreferences()
                  setPreferences(data)
                  setSuccess(false)
                  setError(null)
                } catch (err) {
                  console.error("Failed to reload preferences:", err)
                }
              }
              loadCurrent()
            }}
            disabled={saving}
          >
            取消
          </Button>
          <Button
            onClick={savePreferences}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存设置
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}