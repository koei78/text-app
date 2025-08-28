"use client"

import type React from "react"
import { useAuthStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BookOpen, Brain, MessageCircle, Home, LogOut, Menu as MenuIcon } from "lucide-react"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-amber-50 to-indigo-50">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-full p-2">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">KidCoder-Online</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-3 pr-2">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">こんにちは</p>
                <p className="font-semibold text-foreground">{user.name}さん</p>
              </div>
              {user.role === "teacher" && (
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">先生モード</Badge>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <MenuIcon className="h-4 w-4" /> メニュー
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.push("/")} className={cn(pathname === "/" && "bg-primary/10 text-primary")}>
                  <Home className="h-4 w-4" /> ホーム
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/materials")} className={cn(pathname?.startsWith("/materials") && "bg-primary/10 text-primary")}>
                  <BookOpen className="h-4 w-4" /> 教材
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/quiz")} className={cn(pathname?.startsWith("/quiz") && "bg-primary/10 text-primary")}>
                  <Brain className="h-4 w-4" /> クイズ
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/chat")} className={cn(pathname === "/chat" && "bg-primary/10 text-primary")}>
                  <MessageCircle className="h-4 w-4" /> チャット
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4" /> ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
