import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { RouteGuard } from "@/components/route-guard"
import "./globals.css"

export const metadata: Metadata = {
  title: "KidCoder-Online - 小学生向けオンライン学習",
  description: "楽しく学べる小学生向けオンライン学習アプリ",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased bg-white`}>
        <RouteGuard>{children}</RouteGuard>
      </body>
    </html>
  )
}
