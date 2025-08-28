import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseServer()
    const url = new URL(req.url)
    const email = url.searchParams.get("email")
    let query = supabase.from("students").select("*")
    if (email) {
      query = query.eq("email", email)
    }
    const { data, error } = await query.order("updatedat", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const students = (data ?? []).map((r: any) => ({
      id: r.id,
      name: r.name,
      grade: r.grade,
      email: r.email,
      parentContact: r.parentcontact ?? null,
      authUserId: r.auth_user_id ?? null,
      createdAt: r.createdat,
      updatedAt: r.updatedat,
    }))
    return NextResponse.json({ students })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServer()
    const body = await request.json()
    const now = new Date().toISOString()

    let authUserId: string | null = null
    let warning: string | undefined
    if (body.email && body.initialPassword) {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: body.email,
        password: body.initialPassword,
        email_confirm: true,
      })
      if (createErr) {
        // If the email is already registered in Auth, proceed without failing.
        // Student will use their existing password to sign in.
        warning = `Auth user not created: ${createErr.message}`
      } else {
        authUserId = created.user?.id ?? null
      }
    }

    const payload = {
      name: body.name,
      grade: body.grade,
      email: body.email ?? null,
      parentcontact: body.parentContact ?? null,
      auth_user_id: authUserId,
      createdat: now,
      updatedat: now,
    }
    const { data, error } = await supabase.from("students").insert(payload).select("*").single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const student = {
      id: data.id,
      name: data.name,
      grade: data.grade,
      email: data.email,
      parentContact: data.parentcontact ?? null,
      authUserId: data.auth_user_id ?? null,
      createdAt: data.createdat,
      updatedAt: data.updatedat,
    }
    return NextResponse.json({ student, warning }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
