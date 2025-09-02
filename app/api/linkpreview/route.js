// app/api/linkpreview/route.js
import { NextResponse } from "next/server"

function isYouTube(u) {
  try {
    const { hostname } = new URL(u)
    return /(^|\.)youtube\.com$/.test(hostname) || /(^|\.)youtu\.be$/.test(hostname)
  } catch { return false }
}

function isZoom(u) {
  try {
    const { hostname } = new URL(u)
    return /(^|\.)zoom\.us$/.test(hostname) || /(^|\.)zoom\.com$/.test(hostname)
  } catch { return false }
}

// Zoomリンクから最低限の表示情報を作る（スクレイピング不要）
function buildZoomPreview(u) {
  const url = new URL(u)
  const path = url.pathname || ""
  const isJoin = /\/j\/(\d+)/.test(path)         // 例: /j/1234567890
  const isRecording = /\/rec\//.test(path)       // 例: /rec/share/...
  const idMatch = path.match(/\/j\/(\d+)/)
  const meetingId = idMatch ? idMatch[1] : null
  const pwd = url.searchParams.get("pwd")

  let title = "Zoom"
  let description = "Zoom リンク"
  if (isJoin) {
    title = `Zoom ミーティング${meetingId ? `（ID: ${meetingId}）` : ""}`
    description = `クリックして参加${pwd ? "（パスコード付き）" : ""}`
  } else if (isRecording) {
    title = "Zoom 録画リンク"
    description = "クリックして再生/閲覧"
  }

  return {
    title,
    description,
    image: null,          // 画像は使わず軽量表示
    url: u,
    provider: "zoom",     // ← クライアント側で特別扱いできる
  }
}

// YouTubeはoEmbed優先（成功率が高い）
async function fetchYouTubeOEmbed(url) {
  const o = new URL("https://www.youtube.com/oembed")
  o.searchParams.set("url", url)
  o.searchParams.set("format", "json")
  const r = await fetch(o.toString(), { cache: "no-store" })
  if (!r.ok) throw new Error(`YouTube oEmbed failed: ${r.status}`)
  const j = await r.json()
  return {
    title: j.title,
    description: "YouTube video",
    image: j.thumbnail_url,
    url,
    provider: "youtube-oembed",
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get("url")
  const key = process.env.LINKPREVIEW_KEY

  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 })

  // ← Zoom は先にハンドリング（LinkPreviewを呼ばない）
  if (isZoom(url)) {
    const data = buildZoomPreview(url)
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=60" },
    })
  }

  // YouTubeはoEmbed
  if (isYouTube(url)) {
    try {
      const data = await fetchYouTubeOEmbed(url)
      return NextResponse.json(data, {
        headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=60" },
      })
    } catch (e) {
      // oEmbed失敗時は静かなフォールバック（最低限のリンク表示）
      return NextResponse.json({ url, title: "YouTube", description: "リンク", image: null, provider: "basic" }, { status: 200 })
    }
  }

  // それ以外はLinkPreviewを使用
  if (!key) return NextResponse.json({ error: "LINKPREVIEW_KEY is not set" }, { status: 500 })

  try {
    const api = `https://api.linkpreview.net/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(url)}`
    const r = await fetch(api, { cache: "no-store" })

    if (!r.ok) {
      const softBlockStatuses = new Set([403, 423, 429, 451])
      if (softBlockStatuses.has(r.status)) {
        return NextResponse.json(
          { url, title: null, description: null, image: null, blocked: true, reason: `upstream ${r.status}` },
          { status: 200, headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
        )
      }
      const text = await r.text().catch(() => "")
      return NextResponse.json({ error: `upstream ${r.status}`, detail: text.slice(0, 200) }, { status: 502 })
    }

    const data = await r.json()
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=60" },
    })
  } catch (e) {
    return NextResponse.json({ error: "fetch failed", detail: String(e?.message || e) }, { status: 500 })
  }
}
