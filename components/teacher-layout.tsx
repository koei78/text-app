"use client"

import type React from "react"
import { useAuthStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, MessageCircle, BarChart3, LogOut, Home } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface TeacherLayoutProps {
  children: React.ReactNode
}

export function TeacherLayout({ children }: TeacherLayoutProps) {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (!user || user.role !== "teacher") return null

  const items = [
    { icon: BarChart3, label: "ダッシュボード", path: "/admin/dashboard", color: "text-primary" },
    { icon: BookOpen, label: "教材管理", path: "/admin/materials", color: "text-primary" },
    { icon: Users, label: "生徒管理", path: "/admin/students", color: "text-secondary" },
    { icon: MessageCircle, label: "チャット管理", path: "/admin/chats", color: "text-accent" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-amber-50 to-indigo-50">
      <header className="bg-card/80 backdrop-blur border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-full p-2">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">KidCoder-Online - 管理画面</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Home className="h-4 w-4" />
              生徒画面
            </Button>
            <div className="text-center hidden sm:block">
              <p className="text-sm text-muted-foreground">こんにちは</p>
              <p className="font-semibold text-foreground">{user.name}さん</p>
            </div>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">先生モード</Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t shadow-lg sm:hidden">
        <div className="flex items-center justify-around py-2">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-lg transition-colors",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Sidebar (Desktop) */}
      <aside className="fixed left-4 top-1/2 -translate-y-1/2 hidden lg:block">
        <div className="bg-card/80 backdrop-blur rounded-2xl shadow-lg p-4 space-y-2">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-colors w-full text-left",
                  isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
