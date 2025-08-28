import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabaseServer()
    const { id } = await params
    const { data } = await supabase
      .from("material_visibility")
      .select("student_email,visible")
      .eq("material_id", id)
    return NextResponse.json({ entries: (data as any[]) || [] })
  } catch (e: any) {
    // table may not exist yet; return empty list for graceful degradation
    return NextResponse.json({ entries: [] })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const entries = (body?.entries as Array<{ student_email: string; visible: boolean }>) || []
    const supabase = getSupabaseServer()
    const rows = entries.map((e) => ({ material_id: id, student_email: e.student_email, visible: !!e.visible }))
    const { error } = await supabase
      .from("material_visibility")
      .upsert(rows, { onConflict: "material_id,student_email" })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
