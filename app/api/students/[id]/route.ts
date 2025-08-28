import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServer()
    const { data, error } = await supabase.from("students").select("*").eq("id", params.id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    const student = {
      id: data.id,
      name: data.name,
      grade: data.grade,
      email: data.email,
      parentContact: data.parentcontact ?? null,
      createdAt: data.createdat,
      updatedAt: data.updatedat,
    }
    return NextResponse.json({ student })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServer()
    const body = await request.json()
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from("students")
      .update({
        name: body.name,
        grade: body.grade,
        email: body.email ?? null,
        parentcontact: body.parentContact ?? null,
        updatedat: now,
      })
      .eq("id", params.id)
      .select("*")
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const student = {
      id: data.id,
      name: data.name,
      grade: data.grade,
      email: data.email,
      parentContact: data.parentcontact ?? null,
      createdAt: data.createdat,
      updatedAt: data.updatedat,
    }
    return NextResponse.json({ student })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServer()
    const { error } = await supabase.from("students").delete().eq("id", params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
