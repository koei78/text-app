import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const email = url.searchParams.get("email") || ""
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 })
  try {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase
      .from("material_completions")
      .select("material_id")
      .eq("student_email", email)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ completedIds: (data ?? []).map((r: any) => r.material_id) })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

