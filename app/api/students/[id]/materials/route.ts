import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseServer()
  const { id } = await params
  // resolve student email
  const { data: s, error: e1 } = await supabase.from("students").select("email").eq("id", id).single()
  if (e1 || !s) return NextResponse.json({ error: e1?.message || "student not found" }, { status: 404 })
  const email = (s as any).email
  // load mode
  let mode: "all" | "none" | "custom" = "all"
  try {
    const { data } = await supabase.from("student_material_prefs").select("mode").eq("student_email", email).single()
    if (data?.mode) mode = data.mode
  } catch {}
  // load selected material ids when custom
  let selectedIds: string[] = []
  if (mode === "custom") {
    try {
      const { data } = await supabase
        .from("material_visibility")
        .select("material_id,visible")
        .eq("student_email", email)
      selectedIds = ((data as any[]) || []).filter((r) => r.visible).map((r) => r.material_id)
    } catch {}
  }
  return NextResponse.json({ email, mode, selectedIds })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabaseServer()
  const { id } = await params
  const body = await req.json()
  const mode = (body?.mode as string) || "custom"
  const selected: string[] = Array.isArray(body?.selectedIds) ? body.selectedIds : []
  // resolve student email
  const { data: s, error: e1 } = await supabase.from("students").select("email").eq("id", id).single()
  if (e1 || !s) return NextResponse.json({ error: e1?.message || "student not found" }, { status: 404 })
  const email = (s as any).email

  // upsert mode
  try {
    await supabase.from("student_material_prefs").upsert({ student_email: email, mode }, { onConflict: "student_email" })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }

  if (mode === "custom") {
    // Need all materials to compute false rows as well
    const { data: mats } = await supabase.from("materials").select("id")
    const set = new Set(selected)
    const rows = ((mats as any[]) || []).map((m) => ({ material_id: m.id, student_email: email, visible: set.has(m.id) }))
    const { error } = await supabase.from("material_visibility").upsert(rows, { onConflict: "material_id,student_email" })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (mode === "all") {
    // all visible -> optional: clear overrides for simplicity
    await supabase.from("material_visibility").delete().eq("student_email", email)
  } else if (mode === "none") {
    // all hidden -> set overrides to false for every material
    const { data: mats } = await supabase.from("materials").select("id")
    const rows = ((mats as any[]) || []).map((m) => ({ material_id: m.id, student_email: email, visible: false }))
    await supabase.from("material_visibility").upsert(rows, { onConflict: "material_id,student_email" })
  }

  return NextResponse.json({ ok: true })
}
