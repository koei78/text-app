"use client"

import { useAuthStore, useDataStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Brain, MessageCircle, LogOut } from "lucide-react"
import { useEffect } from "react"

export default function HomePage() {
  const { user, logout } = useAuthStore()
  const { initializeData } = useDataStore()
  const router = useRouter()

  useEffect(() => {
    initializeData()
  }, [initializeData])

  if (!user) return null

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  // Teacher dashboard entry
  if (user.role === "teacher") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-amber-50 to-indigo-50">
        <header className="bg-card/80 backdrop-blur border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary rounded-full p-2">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">きらきらスクール</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">こんにちは</p>
                <p className="font-semibold text-foreground">{user.name}さん</p>
              </div>
              <Badge variant="secondary">先生モード</Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">教師用メニュー</h2>
            <p className="text-muted-foreground">管理画面へ移動してください</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 bg-gradient-to-r from-secondary/10 to-accent/10 backdrop-blur">
              <CardHeader className="text-center">
                <CardTitle className="text-lg">管理画面</CardTitle>
                <CardDescription>教材・クイズ・生徒・チャットの管理</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full h-12 text-base font-semibold" onClick={() => router.push("/admin/dashboard")}>管理画面へ</Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  // Student view
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-amber-50 to-indigo-50">
      <header className="bg-card/80 backdrop-blur border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-full p-2">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">きらきらスクール</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">こんにちは</p>
              <p className="font-semibold text-foreground">{user.name}さん</p>
            </div>
            {user.role === "teacher" && <Badge variant="secondary">先生モード</Badge>}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">今日も楽しく学ぼう！</h2>
          <p className="text-muted-foreground">やりたいことを選んでね</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>教材を見る</CardTitle>
              <CardDescription>いろいろな教材で勉強しよう</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/materials")}>教材を開く</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>クイズに挑戦</CardTitle>
              <CardDescription>楽しいクイズで力試し</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary" onClick={() => router.push("/quiz")}>
                クイズを始める
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>先生とチャット</CardTitle>
              <CardDescription>わからないことを聞いてみよう</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => router.push("/chat")}>
                チャットを開く
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
