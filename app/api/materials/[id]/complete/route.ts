import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const email = (body?.email as string) || ""
    if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 })
    const supabase = getSupabaseServer()
    const { error } = await supabase
      .from("material_completions")
      .upsert({ material_id: id, student_email: email }, { onConflict: "material_id,student_email" })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const email = (body?.email as string) || ""
    if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 })
    const supabase = getSupabaseServer()
    const { error } = await supabase
      .from("material_completions")
      .delete()
      .eq("material_id", id)
      .eq("student_email", email)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

