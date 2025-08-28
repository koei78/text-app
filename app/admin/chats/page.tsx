"use client"

import { TeacherLayout } from "@/components/teacher-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MessageCircle, Search, User, Clock, Pin } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { getSupabaseClient } from "@/lib/supabase/client"

type DBMsg = {
  id: string
  sender_email: string
  receiver_email: string
  text: string
  created_at: string
  read: boolean
}

type Conversation = {
  studentEmail: string
  studentName: string
  messages: DBMsg[]
  lastMessage: DBMsg | null
  unreadCount: number
}

export default function AdminChatsPage() {
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [messages, setMessages] = useState<DBMsg[]>([])
  const [studentNames, setStudentNames] = useState<Record<string, string>>({})
  const router = useRouter()

  // Load teacher-related messages from Supabase and subscribe
  useEffect(() => {
    if (!user?.email) return
    const supabase = getSupabaseClient()

    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("id,sender_email,receiver_email,text,created_at,read")
        .or(`sender_email.eq.${user.email},receiver_email.eq.${user.email}`)
        .order("created_at", { ascending: true })
      setMessages((data as any) ?? [])
    }
    load()

    const channel = supabase
      .channel("admin-messages-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const r = payload.new as DBMsg
        if (r.sender_email === user.email || r.receiver_email === user.email) {
          setMessages((prev) => [...prev, r])
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const r = payload.new as DBMsg
        if (r.sender_email === user.email || r.receiver_email === user.email) {
          setMessages((prev) => prev.map((m) => (m.id === r.id ? r : m)))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Fallback polling to keep list fresh if Realtime is unavailable
  useEffect(() => {
    if (!user?.email) return
    const supabase = getSupabaseClient()
    const interval = setInterval(() => {
      supabase
        .from("messages")
        .select("id,sender_email,receiver_email,text,created_at,read")
        .or(`sender_email.eq.${user.email},receiver_email.eq.${user.email}`)
        .order("created_at", { ascending: true })
        .then(({ data }) => setMessages((data as any) ?? []))
        .catch(() => {})
    }, 8000)
    return () => clearInterval(interval)
  }, [user])

  // Resolve student names for counterpart emails
  useEffect(() => {
    if (!user?.email || messages.length === 0) return
    const counterpartEmails = Array.from(
      new Set(
        messages
          .map((m) => (m.sender_email === user.email ? m.receiver_email : m.sender_email))
          .filter((e) => e !== user.email),
      ),
    )

    const supabase = getSupabaseClient()
    const fetchNames = async () => {
      const { data } = await supabase.from("students").select("email,name").in("email", counterpartEmails)
      const map: Record<string, string> = {}
      ;(data ?? []).forEach((row: any) => {
        map[row.email] = row.name || row.email
      })
      setStudentNames((prev) => ({ ...map, ...prev }))
    }
    if (counterpartEmails.length > 0) fetchNames()
  }, [messages, user])

  // Group messages by student
  const studentConversations: Conversation[] = useMemo(() => {
    if (!user?.email) return []
    const byStudent = new Map<string, Conversation>()
    for (const m of messages) {
      const studentEmail = m.sender_email === user.email ? m.receiver_email : m.sender_email
      if (studentEmail === user.email) continue
      if (!byStudent.has(studentEmail)) {
        byStudent.set(studentEmail, {
          studentEmail,
          studentName: studentNames[studentEmail] || studentEmail,
          messages: [],
          lastMessage: null,
          unreadCount: 0,
        })
      }
      const conv = byStudent.get(studentEmail)!
      conv.messages.push(m)
      if (!conv.lastMessage || new Date(m.created_at) > new Date(conv.lastMessage.created_at)) {
        conv.lastMessage = m
      }
      if (m.sender_email === studentEmail && !m.read) conv.unreadCount++
    }
    return Array.from(byStudent.values())
      .filter((c) => c.messages.length > 0)
      .sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1
        if (!a.lastMessage || !b.lastMessage) return 0
        return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
      })
  }, [messages, studentNames, user])

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return studentConversations
    return studentConversations.filter(
      (conv) => conv.studentName.toLowerCase().includes(q) || conv.studentEmail.toLowerCase().includes(q),
    )
  }, [studentConversations, searchQuery])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    return diffInHours < 24
      ? date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString("ja-JP", { month: "short", day: "numeric" })
  }

  const handleOpenChat = async (studentEmail: string, studentName: string) => {
    const supabase = getSupabaseClient()
    if (user?.email) {
      // mark unread from this student as read before navigating
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("sender_email", studentEmail)
        .eq("receiver_email", user.email)
        .eq("read", false)
    }
    const params = new URLSearchParams({ partner: studentEmail, name: studentName })
    router.push(`/chat?${params.toString()}`)
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-accent/10 rounded-full p-4">
              <MessageCircle className="h-12 w-12 text-accent" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">チャット管理</h1>
            <p className="text-muted-foreground mt-2">生徒との会話を管理しましょう</p>
          </div>
        </div>

        <Card className="border-0 bg-card/80 backdrop-blur">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="生徒名またはメールで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 bg-gradient-to-r from-accent/10 to-accent/5 backdrop-blur">
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-8 w-8 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{studentConversations.length}</p>
              <p className="text-sm text-muted-foreground">アクティブな会話</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur">
            <CardContent className="p-6 text-center">
              <User className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {studentConversations.filter((conv) => conv.unreadCount > 0).length}
              </p>
              <p className="text-sm text-muted-foreground">未返信の生徒</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-r from-secondary/10 to-secondary/5 backdrop-blur">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">
                {studentConversations.reduce((sum, conv) => sum + conv.unreadCount, 0)}
              </p>
              <p className="text-sm text-muted-foreground">未読メッセージ</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {filteredConversations.map((conversation) => (
            <Card
              key={conversation.studentEmail}
              className="hover:shadow-lg transition-shadow cursor-pointer border-0 bg-card/80 backdrop-blur"
              onClick={() => handleOpenChat(conversation.studentEmail, conversation.studentName)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-secondary rounded-full p-3">
                      <User className="h-6 w-6 text-secondary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{conversation.studentName}</h3>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="rounded-full text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage?.sender_email === user?.email ? "あなた: " : ""}
                        {conversation.lastMessage?.text}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {conversation.lastMessage && formatTime(conversation.lastMessage.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Pin className="h-4 w-4" />
                    </Button>
                    <Button size="sm">返信</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredConversations.length === 0 && (
          <Card className="border-0 bg-card/80 backdrop-blur">
            <CardContent className="text-center py-12">
              <div className="bg-muted/50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {studentConversations.length === 0 ? "まだ会話がありません" : "検索結果がありません"}
              </h3>
              <p className="text-muted-foreground">
                {studentConversations.length === 0
                  ? "生徒からメッセージが届くと、ここに表示されます。"
                  : "検索条件を変更してもう一度お試しください。"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </TeacherLayout>
  )
}
