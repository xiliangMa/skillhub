import type { Metadata } from "next"
import "./globals.css"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { I18nProvider } from "@/contexts/i18n-context"
import { UserProvider } from "@/contexts/user-context"

export const metadata: Metadata = {
  title: "Skills Store - AI Skills Marketplace",
  description: "Discover and purchase AI skills for your applications",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">
        <I18nProvider>
          <UserProvider>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </UserProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
