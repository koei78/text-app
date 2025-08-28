"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { StudentLayout } from "@/components/student-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, User, Clock } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import { getSupabaseClient } from "@/lib/supabase/client"

type Msg = {
  id: string
  from: string
  to: string
  text: string
  createdAt: string
  read: boolean
}

export default function ChatPage() {
  const { user } = useAuthStore()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState("")
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const endRef = useRef<HTMLDivElement>(null)

  const partner = useMemo(() => {
    if (!user) return null
    if (user.role === "student") {
      return { email: "teacher@example.com", name: "先生" }
    }
    // teacher side: allow selecting partner via query params
    const emailFromParam = searchParams?.get("partner") || undefined
    const nameFromParam = searchParams?.get("name") || undefined
    if (emailFromParam) {
      return { email: emailFromParam, name: nameFromParam || emailFromParam }
    }
    // Fallback (kept for safety)
    return { email: "student@example.com", name: "生徒" }
  }, [user, searchParams])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgs])

  useEffect(() => {
    if (!user?.email || !partner?.email) return
    const supabase = getSupabaseClient()
    setLoading(true)
    setError("")
    const load = async () => {
      const filter = `and(sender_email.eq.${user.email},receiver_email.eq.${partner.email}),and(sender_email.eq.${partner.email},receiver_email.eq.${user.email})`
      const { data, error } = await supabase
        .from("messages")
        .select("id,sender_email,receiver_email,text,created_at,read")
        .or(filter)
        .order("created_at", { ascending: true })
      if (error) {
        setError(error.message)
      } else {
        setMsgs(
          (data ?? []).map((r: any) => ({
            id: r.id,
            from: r.sender_email,
            to: r.receiver_email,
            text: r.text,
            createdAt: r.created_at,
            read: r.read,
          })),
        )
      }
      setLoading(false)
    }
    load()

    const channel = supabase
      .channel("messages-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const r: any = payload.new
        if (
          (r.sender_email === user.email && r.receiver_email === partner.email) ||
          (r.sender_email === partner.email && r.receiver_email === user.email)
        ) {
          setMsgs((prev) => [
            ...prev,
            { id: r.id, from: r.sender_email, to: r.receiver_email, text: r.text, createdAt: r.created_at, read: r.read },
          ])
          // auto-mark as read if this message is addressed to me and chat is open
          if (r.receiver_email === user.email && !r.read) {
            supabase.from("messages").update({ read: true }).eq("id", r.id)
          }
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const r: any = payload.new
        if (
          (r.sender_email === user.email && r.receiver_email === partner.email) ||
          (r.sender_email === partner.email && r.receiver_email === user.email)
        ) {
          setMsgs((prev) =>
            prev.map((m) => (m.id === r.id ? { id: r.id, from: r.sender_email, to: r.receiver_email, text: r.text, createdAt: r.created_at, read: r.read } : m)),
          )
        }
      })
      .subscribe()

    // Fallback polling in case Realtime fails
    const interval = setInterval(() => {
      supabase
        .from("messages")
        .select("id,sender_email,receiver_email,text,created_at,read")
        .or(
          `and(sender_email.eq.${user.email},receiver_email.eq.${partner.email}),and(sender_email.eq.${partner.email},receiver_email.eq.${user.email})`,
        )
        .order("created_at", { ascending: true })
        .then(({ data }) => {
          if (!data) return
          setMsgs(
            (data ?? []).map((r: any) => ({
              id: r.id,
              from: r.sender_email,
              to: r.receiver_email,
              text: r.text,
              createdAt: r.created_at,
              read: r.read,
            })),
          )
        })
        .catch(() => {})
    }, 6000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [user, partner])

  useEffect(() => {
    if (!user?.email) return
    const supabase = getSupabaseClient()
    const unreadIds = msgs.filter((m) => m.to === user.email && !m.read).map((m) => m.id)
    if (unreadIds.length > 0) {
      ;(async () => {
        const { error } = await supabase.from("messages").update({ read: true }).in("id", unreadIds)
        if (error) {
          // keep local state as-is if update fails
          setError(error.message)
          return
        }
        // optimistic local update; realtime UPDATE will sync across peers
        setMsgs((prev) => prev.map((m) => (unreadIds.includes(m.id) ? { ...m, read: true } : m)))
      })()
    }
  }, [msgs, user])

  if (!user || !partner) return null

  const conversation = msgs
  const unreadCount = conversation.filter((m) => m.from === partner.email && !m.read).length

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diffH = (now.getTime() - d.getTime()) / 36e5
    return diffH < 24
      ? d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    const supabase = getSupabaseClient()
    const text = message.trim()
    setMessage("")
    await supabase.from("messages").insert({ sender_email: user.email, receiver_email: partner.email, text })
  }

  return (
    <StudentLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-accent/10 rounded-full p-4">
              <MessageCircle className="h-12 w-12 text-accent" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {user.role === "student" ? "先生とチャット" : "生徒とチャット"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {user.role === "student" ? "わからないことを気軽に質問してね" : "生徒からの質問に答えよう"}
            </p>
          </div>
        </div>

        <Card className="border-0 bg-card/80 backdrop-blur">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-secondary rounded-full p-2">
                  <User className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">{partner.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>オンライン</span>
                  </CardDescription>
                </div>
              </div>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="rounded-full">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {error && <div className="text-red-600 text-sm">{error}</div>}
              {loading && <div className="text-muted-foreground text-sm">読み込み中...</div>}
              {conversation.length === 0 && !loading ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">まだメッセージがありません</p>
                </div>
              ) : (
                conversation.map((m, i) => {
                  const isMe = m.from === user.email
                  const prev = conversation[i - 1]
                  const showDate = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString()
                  return (
                    <div key={m.id}>
                      {showDate && (
                        <div className="text-center my-4">
                          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                            {new Date(m.createdAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                          <p className="text-sm leading-relaxed">{m.text}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs opacity-70">{formatTime(m.createdAt)}</span>
                            {isMe && <div className="text-xs opacity-70">{m.read ? "既読" : "未読"}</div>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={endRef} />
            </div>

            <div className="border-t p-4">
              <form onSubmit={send} className="flex gap-3">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="メッセージを入力..."
                  className="flex-1 h-12"
                />
                <Button type="submit" size="sm" className="h-12 px-6" disabled={!message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Enterキーで送信</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  )
}
