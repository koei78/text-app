import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase.from("materials").select("*").order("updatedat", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const materials = (data ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      grade: r.grade,
      level: r.level,
      tags: Array.isArray(r.tags) ? r.tags : [],
      htmlContent: r.html_content,
      thumbnailUrl: r.thumbnail_url ?? undefined,
      description: r.description ?? undefined,
      createdAt: r.createdat,
      updatedAt: r.updatedat,
    }))
    return NextResponse.json({ materials })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseServer()
    const body = await req.json()
    const now = new Date().toISOString()
    const payload = {
      title: body.title,
      grade: body.grade,
      level: body.level,
      tags: body.tags ?? [],
      html_content: body.htmlContent,
      thumbnail_url: body.thumbnailUrl ?? null,
      description: body.description ?? null,
      createdat: now,
      updatedat: now,
    }
    const { data, error } = await supabase.from("materials").insert(payload).select("*").single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

