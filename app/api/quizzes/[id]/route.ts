import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getSupabaseServer()
    const { id } = await params
    const { data: quiz, error: qErr } = await supabase.from("quizzes").select("*").eq("id", id).single()
    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 404 })
    const { data: qs, error: qsErr } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", id)
      .order("idx", { ascending: true })
    if (qsErr) return NextResponse.json({ error: qsErr.message }, { status: 500 })
    const questions = (qs ?? []).map((r: any) => {
      switch (r.type) {
        case "single":
          return { id: r.id, type: "single", text: r.text, choices: r.choices ?? [], correctIndex: r.correct_index ?? 0 }
        case "multiple":
          return { id: r.id, type: "multiple", text: r.text, choices: r.choices ?? [], correctIndices: r.correct_indices ?? [] }
        case "boolean":
          return { id: r.id, type: "boolean", text: r.text, answer: !!r.answer_bool }
        default:
          return { id: r.id, type: "text", text: r.text, rubricHint: r.rubric_hint ?? undefined }
      }
    })
    const quizDto = {
      id: quiz.id,
      title: quiz.title,
      level: quiz.level,
      description: quiz.description ?? undefined,
      questions,
      createdAt: quiz.createdat,
      updatedAt: quiz.updatedat,
    }
    return NextResponse.json({ quiz: quizDto })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
