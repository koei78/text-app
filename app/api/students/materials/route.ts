import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const email = url.searchParams.get("email") || ""
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 })
  try {
    const supabase = getSupabaseServer()
    // Fetch all materials
    const { data: mats, error: errM } = await supabase.from("materials").select("*")
    if (errM) return NextResponse.json({ error: errM.message }, { status: 500 })
    // Read per-student policy
    let mode: "all" | "none" | "custom" = "all"
    try {
      const { data: pref } = await supabase.from("student_material_prefs").select("mode").eq("student_email", email).single()
      if (pref?.mode) mode = pref.mode
    } catch {}
    // Fetch visibility overrides
    let visMap: Record<string, boolean> = {}
    try {
      const { data: vis } = await supabase
        .from("material_visibility")
        .select("material_id,visible")
        .eq("student_email", email)
      for (const v of (vis as any[]) || []) visMap[v.material_id] = !!v.visible
    } catch {}

    let materials = (mats ?? []).map((r: any) => ({
      id: r.id,
      title: r.title,
      grade: r.grade,
      level: r.level,
      tags: Array.isArray(r.tags) ? r.tags : [],
      htmlContent: r.html_content,
      thumbnailUrl: r.thumbnail_url ?? undefined,
      description: r.description ?? undefined,
      createdAt: r.createdat,
      updatedAt: r.updatedat,
    }))

    if (mode === "all") {
      // keep all
    } else if (mode === "none") {
      materials = []
    } else {
      // custom: only those explicitly true; if override missing, treat as false
      materials = materials.filter((m: any) => visMap[m.id] === true)
    }

    return NextResponse.json({ materials })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}
