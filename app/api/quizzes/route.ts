import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase.from("quizzes").select("*").order("updatedat", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const quizzes = (data ?? []).map((q: any) => ({
      id: q.id,
      title: q.title,
      level: q.level,
      description: q.description ?? undefined,
      questions: [],
      createdAt: q.createdat,
      updatedAt: q.updatedat,
    }))
    return NextResponse.json({ quizzes })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

