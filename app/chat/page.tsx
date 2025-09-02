"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { StudentLayout } from "@/components/student-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, User, Clock, Link as LinkIcon, Image as ImageIcon, Loader2 } from "lucide-react"
import { useAuthStore } from "@/lib/store"
import { getSupabaseClient } from "@/lib/supabase/client"

type Msg = {
  id: string
  from: string
  to: string
  text: string
  imageUrl?: string
  createdAt: string
  read: boolean
}

type LinkPreview = {
  title?: string
  description?: string
  image?: string
  url?: string
  provider?: "zoom" | "youtube-oembed" | "vimeo" | "spotify" | "soundcloud" | "github" | "image" | "pdf" | "basic"
  blocked?: boolean
  reason?: string
  _status?: "ok" | "loading" | "error"
  _errorMsg?: string
}

// 抽出用（global）と判定用（non-global）を分ける
const URL_REGEX_G = /(https?:\/\/[^\s<>()"\u3000]+)/gi
const URL_IS = /(https?:\/\/[^\s<>()"\u3000]+)/

function extractUrls(text: string): string[] {
  const s = new Set<string>()
  for (const m of text.matchAll(URL_REGEX_G)) {
    if (m[0]) s.add(m[0])
  }
  return [...s]
}



function PreviewCard({ data }: { data: LinkPreview }) {
  // 画像直リンク
  if (data.provider === "image") {
    return (
      <a href={data.url!} target="_blank" rel="noopener noreferrer"
         className="inline-block max-w-xs border rounded-xl bg-white transition p-3 mt-2 shadow-sm">
        <img src={data.image!} alt="image" className="w-full rounded-md object-cover max-h-48" />
        <div className="text-xs text-blue-700 mt-2 break-all">{data.url}</div>
      </a>
    )
  }

  // PDF 直リンク
  if (data.provider === "pdf") {
    return (
      <a href={data.url!} target="_blank" rel="noopener noreferrer"
         className="inline-block max-w-xs border rounded-xl bg-white/90 hover:bg-white transition p-3 mt-2 shadow-sm">
        <div className="flex gap-3 items-start">
          <div className="w-10 h-10 rounded-md bg-red-100 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 2h7l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="currentColor" /></svg>
          </div>
          <div className="min-w-0">
            <div className="font-semibold leading-tight">PDF</div>
            <div className="text-xs text-muted-foreground mt-1">クリックで開く</div>
            <div className="text-xs text-blue-700 mt-1 truncate">{data.url}</div>
          </div>
        </div>
      </a>
    )
  }

  // Zoom（LinkPreviewを通さない想定）
  if (data.provider === "zoom") {
    return (
      <a href={data.url!} target="_blank" rel="noopener noreferrer"
         className="inline-block max-w-xs border rounded-xl bg-white/90 hover:bg-skyblue transition p-3 mt-2 shadow-sm">
        <div className="flex gap-3 items-start">
          <div className="w-20 h-20 rounded-md bg-blue-500 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" width="38" height="38"><path d="M15 10l4-3v10l-4-3v2a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h8a2 2 0 012 2v2z" fill="white"/></svg>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-blue-700 truncate">{data.url}</div>
            <div className="font-semibold  text-black leading-tight mt-1">{data.title || "Zoom"}</div>
            <div className="text-xs text-black mt-1">{data.description || "リンク"}</div>
          </div>
        </div>
      </a>
    )
  }

  // oEmbed系（YouTube/Vimeo/Spotify/SoundCloud）
  if (["youtube-oembed", "vimeo", "spotify", "soundcloud"].includes(data.provider || "")) {
    return (
      <a href={data.url!} target="_blank" rel="noopener noreferrer"
         className="inline-block max-w-xs border rounded-xl bg-white/90 hover:bg-white transition p-3 mt-2 shadow-sm">
        <div className="flex gap-3 items-start">
          <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {data.image ? <img src={data.image} alt={data.title || "preview"} className="w-full h-full object-cover" /> : <div className="text-xs opacity-60">media</div>}
          </div>
          <div className="min-w-0">
            <div className="font-semibold leading-tight line-clamp-2">{data.title || "メディア"}</div>
            <div className="text-xs text-muted-foreground mt-1">{data.description || data.provider}</div>
            <div className="text-xs text-blue-700 mt-1 truncate">{data.url}</div>
          </div>
        </div>
      </a>
    )
  }

  // GitHub 簡易
  if (data.provider === "github") {
    return (
      <a href={data.url!} target="_blank" rel="noopener noreferrer"
         className="inline-block max-w-xs border rounded-xl bg-white/90 hover:bg-white transition p-3 mt-2 shadow-sm">
        <div className="flex gap-3 items-start">
          <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 .5C5.73.5.98 5.24.98 11.5c0 4.85 3.14 8.96 7.49 10.41.55.1.75-.24.75-.53v-1.88c-3.05.66-3.69-1.3-3.69-1.3-.5-1.27-1.23-1.6-1.23-1.6-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 .1.77 1.99 2.82 1.42.1-.74.39-1.25.71-1.53-2.44-.28-5-1.22-5-5.41 0-1.2.43-2.19 1.14-2.96-.12-.28-.49-1.41.11-2.94 0 0 .93-.3 3.05 1.13.89-.25 1.84-.37 2.79-.38.95.01 1.9.13 2.79.38 2.12-1.43 3.04-1.13 3.04-1.13.6 1.53.23 2.66.11 2.94.71.77 1.14 1.76 1.14 2.96 0 4.2-2.57 5.12-5.02 5.4.4.34.76 1.01.76 2.05v3.03c0 .29.2.63.76.53 4.35-1.45 7.49-5.56 7.49-10.41C23.02 5.24 18.27.5 12 .5z" fill="currentColor"/></svg>
          </div>
          <div className="min-w-0">
            <div className="font-semibold leading-tight">{data.title || "GitHub"}</div>
            <div className="text-xs text-muted-foreground mt-1">{data.description || "リンク"}</div>
            <div className="text-xs text-blue-700 mt-1 truncate">{data.url}</div>
          </div>
        </div>
      </a>
    )
  }

  // blocked（403/423/429/451 等は静かなフォールバック）
  if (data.blocked) {
    return (
      <a href={data.url!} target="_blank" rel="noopener noreferrer"
         className="inline-block max-w-xs border rounded-xl bg-white/80 hover:bg-white transition p-3 mt-2 shadow-sm">
        <div className="text-xs text-muted-foreground mb-1">このリンクはプレビュー非対応</div>
        <div className="text-blue-700 underline break-all text-sm">{data.url}</div>
      </a>
    )
  }

  // 通常（LinkPreviewの成功パス）
  // 通常（LinkPreviewの成功パス）
return (
  <a
    href={data.url || "#"}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-block max-w-xs border rounded-xl rounded-br-nonebg-white/90 hover:bg-white transition p-3 mt-2 shadow-sm"
  >
    <div className="flex gap-3 items-start">
      <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
        {data._status === "loading" ? (
          <Loader2 className="h-5 w-5 animate-spin opacity-60" />
        ) : data.image ? (
          <img
            src={data.image}
            alt={data.title || data.url || "preview"}
            className="w-full h-full object-cover"
            onError={(e) => ((e.currentTarget.style.display = "none"))}
          />
        ) : (
          <ImageIcon className="h-5 w-5 opacity-60" />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <LinkIcon className="h-3.5 w-3.5 opacity-60" />
          <span className="text-xs text-blue-700 truncate">{data.url}</span>
        </div>
        <div className="font-semibold leading-tight line-clamp-2">{data.title || "タイトルなし"}</div>
        <div className="text-xs text-muted-foreground mt-1 line-clamp-3">
          {data._status === "error"
            ? `プレビュー取得に失敗しました: ${data._errorMsg ?? ""}`
            : (data.description || "説明はありません")}
        </div>
      </div>
    </div>
  </a>
)

}


export default function ChatPage() {
  const { user } = useAuthStore()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const endRef = useRef<HTMLDivElement>(null)

  // ---------------- Link Preview キャッシュ ----------------
  const [previewMap, setPreviewMap] = useState<Record<string, LinkPreview>>({})

  // 未取得URLを一括フェッチ（重複防止・簡易レート制御）
  useEffect(() => {
    const allTexts = msgs.map((m) => m.text || "").filter(Boolean)
    const allUrls = new Set<string>()
    for (const t of allTexts) extractUrls(t).forEach((u) => allUrls.add(u))

    const toFetch: string[] = []
    allUrls.forEach((u) => {
      if (!previewMap[u]) toFetch.push(u)
    })

    if (toFetch.length === 0) return

    // 先にloadingで予約
    setPreviewMap((prev) => {
      const next = { ...prev }
      for (const u of toFetch) next[u] = { _status: "loading", url: u }
      return next
    })

    // 直列でも十分だが、軽く並列(最大3同時)で回す
    const concurrency = 3
    let index = 0

    const worker = async () => {
      while (index < toFetch.length) {
        const myIdx = index++
        const url = toFetch[myIdx]
        try {
          const r = await fetch(`/api/linkpreview?url=${encodeURIComponent(url)}`, { cache: "no-store" })
          if (!r.ok) {
            const txt = await r.text().catch(() => "")
            setPreviewMap((prev) => ({ ...prev, [url]: { _status: "error", url, _errorMsg: `HTTP ${r.status} ${txt.slice(0,100)}` } }))
            continue
          }
          const data = (await r.json()) as LinkPreview
          setPreviewMap((prev) => ({ ...prev, [url]: { ...data, _status: "ok" } }))
        } catch (e: any) {
          setPreviewMap((prev) => ({ ...prev, [url]: { _status: "error", url, _errorMsg: String(e?.message || e) } }))
        }
      }
    }

    const workers = Array.from({ length: Math.min(concurrency, toFetch.length) }, () => worker())
    Promise.all(workers).catch(() => {})
  }, [msgs])

  const partner = useMemo(() => {
    if (!user) return null
    if (user.role === "student") {
      return { email: "teacher@example.com", name: "tt先生" }
    }
    const emailFromParam = searchParams?.get("partner") || undefined
    const nameFromParam = searchParams?.get("name") || undefined
    if (emailFromParam) {
      return { email: emailFromParam, name: nameFromParam || emailFromParam }
    }
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
        .select("id,sender_email,receiver_email,text,image_url,created_at,read")
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
            imageUrl: (r as any).image_url ?? undefined,
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
            { id: r.id, from: r.sender_email, to: r.receiver_email, text: r.text, imageUrl: r.image_url ?? undefined, createdAt: r.created_at, read: r.read },
          ])
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
            prev.map((m) => (m.id === r.id ? { id: r.id, from: r.sender_email, to: r.receiver_email, text: r.text, imageUrl: r.image_url ?? undefined, createdAt: r.created_at, read: r.read } : m)),
          )
        }
      })
      .subscribe()

    const interval = setInterval(() => {
      supabase
        .from("messages")
        .select("id,sender_email,receiver_email,text,image_url,created_at,read")
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
              imageUrl: (r as any).image_url ?? undefined,
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
          setError(error.message)
          return
        }
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
    if (!message.trim() && !imageFile) return
    const supabase = getSupabaseClient()
    let image_url: string | undefined
    if (imageFile) {
      const file = imageFile
      const ext = file.name.split('.').pop() || 'png'
      const path = `${user.email.replace(/[^a-zA-Z0-9]/g, '_')}/${Date.now()}.${ext}`
      const { data: up, error: upErr } = await (supabase as any).storage.from('chat-images').upload(path, file, { upsert: true })
      if (!upErr) {
        const { data: pub } = (supabase as any).storage.from('chat-images').getPublicUrl(path)
        image_url = pub?.publicUrl
      }
    }
    const text = message.trim()
    setMessage("")
    setImageFile(null)
    await supabase.from("messages").insert({ sender_email: user.email, receiver_email: partner.email, text, image_url })
  }

  // メッセージ本文中のURLをリンク化 + プレビュー表示
  function renderMessageText(text: string) {
  const parts = text.split(URL_REGEX_G)
  const urls = extractUrls(text) /* .slice(0, 3) ← 上限をつけたい場合 */

  return (
    <>
      {parts.map((part, i) =>
        URL_IS.test(part) ? (
          <a key={`lnk-${i}`} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-all">
            {part}
          </a>
        ) : (
          <span key={`txt-${i}`}>{part}</span>
        )
      )}

      {urls.map((u) => {
        const p = previewMap[u]
        if (!p) return null
        return <PreviewCard key={`pv-${u}`} data={p} />
      })}
    </>
  )
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
<div
  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
    isMe
      ? "rounded-br-none bg-primary text-primary-foreground" // 自分(右)は右下を直角
      : "rounded-bl-none bg-muted text-foreground"           // 相手(左)は左下を直角
  }`}
>



                            {m.imageUrl && (
                              <img src={m.imageUrl} alt="image" className="rounded-md mb-2 max-h-60 object-contain" />
                            )}
                            {m.text && (
                              <div className="text-sm leading-relaxed space-y-2">
                                {renderMessageText(m.text)}
                              </div>
                            )}
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

