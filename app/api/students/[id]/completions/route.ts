import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const supabase = getSupabaseServer()
    const { data: s, error: e1 } = await supabase.from("students").select("email").eq("id", id).single()
    if (e1 || !s) return NextResponse.json({ error: e1?.message || "student not found" }, { status: 404 })
    const email = (s as any).email
    const { data, error } = await supabase
      .from("material_completions")
      .select("material_id, completed_at")
      .eq("student_email", email)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ email, completions: data ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

