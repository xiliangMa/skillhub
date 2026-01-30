"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, ArrowLeft, CreditCard } from "lucide-react"
import Link from "next/link"
import { paymentApi } from "@/lib/api"

export default function MockPaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"pending" | "success" | "failed">("pending")
  const [loading, setLoading] = useState(false)

  const paymentId = searchParams.get("id")
  const orderNo = searchParams.get("order_no")
  const amount = searchParams.get("amount")
  const paymentType = searchParams.get("type") || "alipay"

  useEffect(() => {
    if (!paymentId || !orderNo || !amount) {
      router.push("/skills")
    }
  }, [paymentId, orderNo, amount, router])

  const handlePayment = async (success: boolean) => {
    setLoading(true)
    try {
      // 模拟支付处理延迟
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (success) {
        setStatus("success")
        // 模拟回调到后端
        await simulateCallback(true)
      } else {
        setStatus("failed")
        await simulateCallback(false)
      }
    } catch (error) {
      console.error("Payment simulation failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const simulateCallback = async (success: boolean) => {
    try {
      if (!orderNo) {
        console.error("Order number is missing")
        return
      }

      const tradeStatus = success ? "TRADE_SUCCESS" : "TRADE_FAILED"
      const totalAmount = amount || "0.00"

      await paymentApi.mockCallback(orderNo, tradeStatus, paymentType, undefined, totalAmount)

      console.log(`Simulated ${success ? "successful" : "failed"} payment callback for order ${orderNo}`)
    } catch (error) {
      console.error("Failed to simulate callback:", error)
      // 可以选择显示错误信息给用户
    }
  }

  const getPaymentTypeName = () => {
    switch (paymentType) {
      case "alipay": return "支付宝"
      case "wechat": return "微信支付"
      default: return "模拟支付"
    }
  }

  if (!paymentId || !orderNo || !amount) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-muted-foreground mb-4">无效的支付参数</p>
        <Button variant="outline" onClick={() => router.push("/skills")}>
          返回技能列表
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <Link href="/skills">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                模拟支付 - {getPaymentTypeName()}
              </CardTitle>
              <CardDescription>
                开发环境模拟支付页面，用于测试支付流程
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 订单信息 */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">订单号:</span>
                  <span className="font-medium">{orderNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">支付ID:</span>
                  <span className="font-mono text-sm">{paymentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">支付方式:</span>
                  <span>{getPaymentTypeName()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">支付金额:</span>
                  <span className="text-lg font-bold">${parseFloat(amount).toFixed(2)}</span>
                </div>
              </div>

              {/* 支付状态 */}
              {status === "pending" ? (
                <div className="space-y-4">
                  <p className="text-center text-muted-foreground">
                    请选择支付结果进行测试
                  </p>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => handlePayment(true)}
                      disabled={loading}
                      className="flex-1"
                      size="lg"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      支付成功
                    </Button>
                    <Button
                      onClick={() => handlePayment(false)}
                      disabled={loading}
                      variant="destructive"
                      className="flex-1"
                      size="lg"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      支付失败
                    </Button>
                  </div>
                </div>
              ) : status === "success" ? (
                <div className="text-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  <div>
                    <h3 className="text-xl font-bold mb-2">支付成功</h3>
                    <p className="text-muted-foreground">
                      订单已支付成功，正在跳转到订单页面...
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push("/skills")}
                    className="w-full"
                  >
                    返回技能商店
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <XCircle className="h-16 w-16 text-red-500 mx-auto" />
                  <div>
                    <h3 className="text-xl font-bold mb-2">支付失败</h3>
                    <p className="text-muted-foreground">
                      支付过程中出现错误，请重试或联系客服
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => setStatus("pending")}
                      variant="outline"
                      className="flex-1"
                    >
                      重试支付
                    </Button>
                    <Button
                      onClick={() => router.push("/skills")}
                      className="flex-1"
                    >
                      返回商店
                    </Button>
                  </div>
                </div>
              )}

              {/* 开发说明 */}
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  注意：这是模拟支付页面，仅用于开发和测试环境。
                  在生产环境中，用户将被重转到真实的支付网关（支付宝、微信支付等）。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}