"use client"

import type React from "react"
import { useAuthStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Brain, MessageCircle, Home, LogOut } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface StudentLayoutProps {
  children: React.ReactNode
}

export function StudentLayout({ children }: StudentLayoutProps) {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (!user) return null

  const navigationItems = [
    {
      icon: Home,
      label: "ホーム",
      path: "/",
      color: "text-primary",
    },
    {
      icon: BookOpen,
      label: "教材",
      path: "/materials",
      color: "text-primary",
    },
    {
      icon: Brain,
      label: "クイズ",
      path: "/quiz",
      color: "text-secondary",
    },
    {
      icon: MessageCircle,
      label: "チャット",
      path: "/chat",
      color: "text-accent",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-amber-50 to-indigo-50">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-full p-2">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">きらきらスクール</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center hidden sm:block">
              <p className="text-sm text-muted-foreground">こんにちは</p>
              <p className="font-semibold text-foreground">{user.name}さん</p>
            </div>
            {user.role === "teacher" && (
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                先生モード
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>

      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t shadow-lg sm:hidden">
        <div className="flex items-center justify-around py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Desktop Navigation Sidebar */}
      <aside className="fixed left-4 top-1/2 -translate-y-1/2 hidden lg:block">
        <div className="bg-card/80 backdrop-blur rounded-2xl shadow-lg p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-colors w-full text-left",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
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
