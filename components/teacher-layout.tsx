"use client"

import type React from "react"
import { useAuthStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Users, MessageCircle, BarChart3, LogOut, Home, Menu as MenuIcon } from "lucide-react"
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
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-3 pr-2">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">こんにちは</p>
                <p className="font-semibold text-foreground">{user.name}さん</p>
              </div>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">先生モード</Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <MenuIcon className="h-4 w-4" /> メニュー
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.push("/")}> 
                  <Home className="h-4 w-4" /> 生徒画面に戻る
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/admin/dashboard")} className={cn(pathname === "/admin/dashboard" && "bg-primary/10 text-primary")}> 
                  <BarChart3 className="h-4 w-4" /> ダッシュボード
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/admin/materials")} className={cn(pathname === "/admin/materials" && "bg-primary/10 text-primary")}> 
                  <BookOpen className="h-4 w-4" /> 教材管理
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/admin/students")} className={cn(pathname === "/admin/students" && "bg-primary/10 text-primary")}> 
                  <Users className="h-4 w-4" /> 生徒管理
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/admin/chats")} className={cn(pathname === "/admin/chats" && "bg-primary/10 text-primary")}> 
                  <MessageCircle className="h-4 w-4" /> チャット管理
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4" /> ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
