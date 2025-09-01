// app/api/linkpreview/route.js
import { NextResponse } from "next/server"

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get("url")
  const key = process.env.LINKPREVIEW_KEY

  if (!key) {
    return NextResponse.json({ error: "LINKPREVIEW_KEY is not set" }, { status: 500 })
  }
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 })
  }

  try {
    const api = `https://api.linkpreview.net/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(url)}`
    const r = await fetch(api, { cache: "no-store" })
    if (!r.ok) {
      const text = await r.text().catch(() => "")
      return NextResponse.json({ error: `upstream ${r.status}`, detail: text }, { status: 502 })
    }
    const data = await r.json()
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=60",
      },
    })
  } catch (e) {
    return NextResponse.json({ error: "fetch failed", detail: String(e && e.message ? e.message : e) }, { status: 500 })
  }
}
