"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser } from "@/contexts/user-context"
import { useI18n } from "@/contexts/i18n-context"
import { authApi } from "@/lib/api"
import {
  User,
  Upload,
  Globe,
  MapPin,
  Link,
  Github,
  Twitter,
  Linkedin,
  Save,
  Loader2,
  Camera,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// 表单验证模式
const profileSchema = z.object({
  name: z.string().min(1, "姓名不能为空").optional().or(z.literal('')),
  username: z.string()
    .min(3, "用户名至少3个字符")
    .max(30, "用户名最多30个字符")
    .regex(/^[a-zA-Z0-9_]+$/, "只能包含字母、数字和下划线")
    .optional()
    .or(z.literal('')),
  bio: z.string().max(500, "个人简介最多500字符").optional().or(z.literal('')),
  avatar_url: z.string().url("请输入有效的URL").optional().or(z.literal('')),
  timezone: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
  website: z.string().url("请输入有效的URL").optional().or(z.literal('')),
  github: z.string().optional().or(z.literal('')),
  twitter: z.string().optional().or(z.literal('')),
  linkedin: z.string().optional().or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { user, refreshUser } = useUser()
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("basic")

  // 初始化表单
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      username: "",
      bio: "",
      avatar_url: "",
      timezone: "",
      location: "",
      website: "",
      github: "",
      twitter: "",
      linkedin: "",
    }
  })

  // 当用户数据加载时，填充表单
  useEffect(() => {
    if (user) {
      // 从用户数据中提取信息
      const profileData = {
        name: user.name || "",
        username: user.username || "",
        bio: user.profile?.bio || "",
        avatar_url: user.profile?.avatar_url || "",
        timezone: "",
        location: "",
        website: "",
        github: "",
        twitter: "",
        linkedin: "",
      }

      // 如果有偏好设置（JSON格式），解析它们
      if (user.profile?.preferences) {
        try {
          const preferences = JSON.parse(user.profile.preferences)
          Object.assign(profileData, {
            timezone: preferences.timezone || "",
            location: preferences.location || "",
            website: preferences.website || "",
            github: preferences.github || "",
            twitter: preferences.twitter || "",
            linkedin: preferences.linkedin || "",
          })
        } catch (e) {
          console.error("Failed to parse preferences:", e)
        }
      }

      form.reset(profileData)
    }
  }, [user, form])

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true)
    setSuccess(false)
    setError(null)

    try {
      // 过滤空字符串，转换为undefined
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          value === "" ? undefined : value
        ])
      ) as ProfileFormData

      await authApi.updateProfile(cleanData)
      await refreshUser()
      setSuccess(true)

      // 3秒后隐藏成功消息
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error("Failed to update profile:", err)
      setError(err.response?.data?.error || "更新失败，请重试")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-slate-600">加载个人信息...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          {t.dashboard?.nav?.profile || "个人信息"}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          {t.dashboard?.nav?.profileDesc || "管理个人资料和头像"}
        </p>
      </div>

      {/* 提示信息 */}
      {success && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-300">保存成功</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            个人信息已成功更新
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="basic">
                <User className="h-4 w-4 mr-2" />
                基本信息
              </TabsTrigger>
              <TabsTrigger value="avatar">
                <Camera className="h-4 w-4 mr-2" />
                头像设置
              </TabsTrigger>
              <TabsTrigger value="social">
                <Link className="h-4 w-4 mr-2" />
                社交媒体
              </TabsTrigger>
            </TabsList>

            {/* 基本信息选项卡 */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>基本信息</CardTitle>
                  <CardDescription>
                    您的个人资料信息将公开显示
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>姓名</FormLabel>
                          <FormControl>
                            <Input placeholder="您的真实姓名" {...field} />
                          </FormControl>
                          <FormDescription>
                            这将显示在您的个人资料页面上
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>用户名</FormLabel>
                          <FormControl>
                            <Input placeholder="唯一用户名" {...field} />
                          </FormControl>
                          <FormDescription>
                            用于个人主页 URL，如 /@{field.value || "username"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>个人简介</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="简单介绍一下自己..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          简短的个人描述，最多500字符
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Globe className="h-4 w-4 inline mr-1" />
                            时区
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="例如: Asia/Shanghai" {...field} />
                          </FormControl>
                          <FormDescription>
                            用于时间相关的通知和提醒
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <MapPin className="h-4 w-4 inline mr-1" />
                            地区
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="例如: 中国，北京" {...field} />
                          </FormControl>
                          <FormDescription>
                            您所在的地区或城市
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 头像设置选项卡 */}
            <TabsContent value="avatar" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>头像设置</CardTitle>
                  <CardDescription>
                    上传或设置您的个人头像
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* 头像预览 */}
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-slate-800 dark:to-slate-900 border-4 border-white dark:border-slate-800 shadow-lg overflow-hidden">
                        {form.watch("avatar_url") ? (
                          <img
                            src={form.watch("avatar_url")}
                            alt="Avatar preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="h-16 w-16 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700">
                        <Camera className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                    </div>

                    {/* 头像URL输入 */}
                    <div className="flex-1 w-full">
                      <FormField
                        control={form.control}
                        name="avatar_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>头像URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://example.com/avatar.jpg"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              输入头像图片的URL地址，支持JPG、PNG等格式
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          头像上传提示
                        </h4>
                        <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                          <li>• 推荐使用正方形图片，尺寸至少256×256像素</li>
                          <li>• 支持JPG、PNG、WebP格式</li>
                          <li>• 最大文件大小：5MB</li>
                          <li>• 您也可以使用外部图床服务</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                          头像上传功能即将推出
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                          目前仅支持通过URL设置头像，文件上传功能正在开发中。
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 社交媒体选项卡 */}
            <TabsContent value="social" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>社交媒体链接</CardTitle>
                  <CardDescription>
                    添加您的社交媒体账号链接
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Link className="h-4 w-4 inline mr-1" />
                          个人网站
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://your-website.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          您的个人博客或作品集网站
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="github"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Github className="h-4 w-4 inline mr-1" />
                            GitHub
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="https://github.com/username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="twitter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Twitter className="h-4 w-4 inline mr-1" />
                            Twitter / X
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="https://twitter.com/username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="linkedin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <Linkedin className="h-4 w-4 inline mr-1" />
                            LinkedIn
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="https://linkedin.com/in/username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* 表单操作按钮 */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              修改后请点击保存按钮
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (user) {
                    // 重置表单到当前用户数据
                    const profileData = {
                      name: user.name || "",
                      username: user.username || "",
                      bio: user.profile?.bio || "",
                      avatar_url: user.profile?.avatar_url || "",
                      timezone: "",
                      location: "",
                      website: "",
                      github: "",
                      twitter: "",
                      linkedin: "",
                    }

                    if (user.profile?.preferences) {
                      try {
                        const preferences = JSON.parse(user.profile.preferences)
                        Object.assign(profileData, {
                          timezone: preferences.timezone || "",
                          location: preferences.location || "",
                          website: preferences.website || "",
                          github: preferences.github || "",
                          twitter: preferences.twitter || "",
                          linkedin: preferences.linkedin || "",
                        })
                      } catch (e) {
                        console.error("Failed to parse preferences:", e)
                      }
                    }

                    form.reset(profileData)
                    setSuccess(false)
                    setError(null)
                  }
                }}
                disabled={saving}
              >
                重置
              </Button>
              <Button
                type="submit"
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
                    保存更改
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}