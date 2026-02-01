"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings } from "lucide-react"
import { useI18n } from "@/contexts/i18n-context"

export default function SettingsPage() {
  const { t } = useI18n()
  
  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-20" />
        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 overflow-hidden">
          <div className="p-6 border-b border-slate-200/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{t.admin?.settings || '系统设置'}</h3>
                <p className="text-sm text-slate-500 mt-1">平台配置和参数设置</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100/50 to-cyan-100/50">
                <Settings className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="text-center py-12 text-slate-400">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              系统设置功能正在开发中，即将推出
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}