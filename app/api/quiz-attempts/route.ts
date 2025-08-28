import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = getSupabaseServer()
    const payload = {
      quiz_id: body.quizId,
      user_email: body.userEmail,
      answers: body.answers ?? {},
      score_auto: body.scoreAuto ?? null,
    }
    const { error } = await supabase.from("quiz_attempts").insert(payload)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

