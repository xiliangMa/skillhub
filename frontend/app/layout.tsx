import type { Metadata } from "next"
import "./globals.css"

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
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
