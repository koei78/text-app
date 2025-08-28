import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabaseServer()
    const { id } = await params
    const { data, error } = await supabase.from("materials").select("*").eq("id", id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    const m = data as any
    const material = {
      id: m.id,
      title: m.title,
      grade: m.grade,
      level: m.level,
      tags: Array.isArray(m.tags) ? m.tags : [],
      htmlContent: m.html_content,
      thumbnailUrl: m.thumbnail_url ?? undefined,
      description: m.description ?? undefined,
      createdAt: m.createdat,
      updatedAt: m.updatedat,
    }
    return NextResponse.json({ material })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabaseServer()
    const { id } = await params
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
      updatedat: now,
    }
    const { error } = await supabase.from("materials").update(payload).eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabaseServer()
    const { id } = await params
    const { error } = await supabase.from("materials").delete().eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
