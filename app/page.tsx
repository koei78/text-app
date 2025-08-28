"use client"

import { useAuthStore, useDataStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Brain, MessageCircle, LogOut, ArrowRight, Clock } from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { StudentLayout } from "@/components/student-layout"

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
      <div className="min-h-screen bg-white">
        <header className="bg-card/80 backdrop-blur border-b shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary rounded-full p-2">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">HOMEラボ・キッズ</h1>
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
    <StudentLayout>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Floating blobs for pop feel */}
        <div className="pointer-events-none absolute -top-10 -left-12 h-56 w-56 rounded-full bg-pink-300/40 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute top-24 -right-16 h-64 w-64 rounded-full bg-indigo-300/40 blur-3xl animate-ping" />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 h-40 w-40 rounded-full bg-amber-300/40 blur-3xl animate-pulse" />

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border shadow-sm bg-gradient-to-r from-pink-100 via-amber-100 to-indigo-100">
          {/* Fun stickers */}
          <div className="pointer-events-none absolute right-4 top-4 text-3xl rotate-6 select-none">🎉</div>
          <div className="pointer-events-none absolute left-6 bottom-4 text-3xl -rotate-6 select-none">✨</div>
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="bg-primary rounded-full p-2">
                <BookOpen className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">ダッシュボード</h2>
            </div>
            <StudentDashboard />
          </div>
        </div>


        {/* Action Cards (square) */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Materials */}
          <Card className="group relative border-0 overflow-hidden rounded-3xl shadow-md hover:shadow-2xl transition-all">
            <div className="aspect-square w-full grid grid-rows-[1fr_auto] p-5">
              <div className="relative overflow-hidden min-h-0">
                <img src="/マイクロビットimg.png" alt="教材" className="absolute inset-0 m-auto h-60 w-full object-contain " />
              </div>
              <div className="pt-4 text-center space-y-3">
                <div>
                  <CardTitle className="text-xl text-foreground">教材でまなぶ</CardTitle>
                  <CardDescription className="text-muted-foreground">たのしい教材がいっぱい！</CardDescription>
                </div>
                <Button className="h-12 text-base gap-2 px-8 w-full" onClick={() => router.push("/materials")}>
                  開く <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Quiz */}
          <Card className="group relative border-0 overflow-hidden rounded-3xl shadow-md hover:shadow-2xl transition-all">
            <div className="aspect-square w-full grid grid-rows-[1fr_auto] p-5">
              <div className="relative overflow-hidden min-h-0">
                <img src="/quiz.png" alt="クイズ" className="absolute inset-0 m-auto h-46 w-46 object-contain " />
              </div>
              <div className="pt-4 text-center space-y-3">
                
                <div>
                  <CardTitle className="text-xl text-foreground">クイズにちょうせん</CardTitle>
                  <CardDescription className="text-muted-foreground">ゲームみたいに学べる！</CardDescription>
                </div>
                <Button className="h-12 text-base gap-2 px-8 w-full" variant="secondary" onClick={() => router.push("/quiz")}> 
                  はじめる <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Chat */}
          <Card className="group relative border-0 overflow-hidden rounded-3xl shadow-md hover:shadow-2xl transition-all">
            <div className="aspect-square w-full grid grid-rows-[1fr_auto] p-5">
              <div className="relative overflow-hidden min-h-0">
                <img src="/chat.png" alt="チャット" className="absolute inset-0 m-auto h-full w-full object-contain " />
              </div>
              <div className="pt-4 text-center space-y-3">
             
                <div>
                  <CardTitle className="text-xl text-foreground">先生とチャット</CardTitle>
                  <CardDescription className="text-muted-foreground">わからないことを聞いてみよう</CardDescription>
                </div>
                <Button className="h-12 text-base gap-2 px-8 w-full" variant="outline" onClick={() => router.push("/chat")}> 
                  ひらく <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </StudentLayout>
  )
}

function StudentDashboard(): React.ReactElement {
  const { user } = useAuthStore()
  const [latestMessages, setLatestMessages] = useState<Array<{ id: string; text: string; createdAt: string }>>([])
  const [latestMaterials, setLatestMaterials] = useState<Array<{ id: string; title: string; updatedAt: string }>>([])

  useEffect(() => {
    const run = async () => {
      try {
        if (user?.email && process.env.NEXT_PUBLIC_SUPABASE_URL) {
          const supabase = getSupabaseClient()
          const { data } = await supabase
            .from("messages")
            .select("id,text,created_at,receiver_email")
            .eq("receiver_email", user.email)
            .order("created_at", { ascending: false })
            .limit(5)
          setLatestMessages(
            (data ?? []).map((r: any) => ({ id: r.id, text: r.text as string, createdAt: r.created_at as string }))
          )
        }
      } catch {}

      try {
        if (user?.email) {
          const res = await fetch(`/api/students/materials?email=${encodeURIComponent(user.email)}`, { cache: "no-store" })
          if (res.ok) {
            const json = await res.json()
            const list = Array.isArray(json.materials) ? json.materials : []
            const sorted = list
              .slice()
              .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, 5)
              .map((m: any) => ({ id: m.id as string, title: m.title as string, updatedAt: m.updatedAt as string }))
            setLatestMaterials(sorted)
          }
        }
      } catch {}
    }
    run()
  }, [user?.email])

  const fmt = (iso: string) => new Date(iso).toLocaleString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4 text-accent" /> 新着メッセージ
          </CardTitle>
          <CardDescription>先生からの最新メッセージ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {latestMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground">新着メッセージはありません</p>
          ) : (
            latestMessages.map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-3">
                <p className="text-sm text-foreground line-clamp-2">{m.text || "(本文なし)"}</p>
                <span className="shrink-0 text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {fmt(m.createdAt)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" /> 新規に追加された課題
          </CardTitle>
          <CardDescription>最近追加・更新された教材</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {latestMaterials.length === 0 ? (
            <p className="text-sm text-muted-foreground">新しい課題はありません</p>
          ) : (
            latestMaterials.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3">
                <p className="text-sm text-foreground line-clamp-2">{m.title}</p>
                <span className="shrink-0 text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {fmt(m.updatedAt)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
