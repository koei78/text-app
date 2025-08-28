"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { TeacherLayout } from "@/components/teacher-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { getSupabaseClient } from "@/lib/supabase/client"
import { ArrowLeft, Users, BookOpen } from "lucide-react"

export default function MaterialVisibilityPage() {
  const params = useParams()
  const router = useRouter()
  const materialId = String(params.id)
  const [materialTitle, setMaterialTitle] = useState<string>("")
  const [students, setStudents] = useState<Array<{ email: string; name: string }>>([])
  const [visMap, setVisMap] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseClient()
      // load material title for header
      try {
        const { data } = await supabase.from("materials").select("id,title").eq("id", materialId).single()
        setMaterialTitle((data as any)?.title || "")
      } catch {}
      // load students
      try {
        const { data } = await supabase.from("students").select("email,name").order("name", { ascending: true })
        setStudents(((data as any[]) || []).map((r) => ({ email: r.email, name: r.name })))
      } catch {}
      // load visibility entries
      try {
        const res = await fetch(`/api/materials/${materialId}/visibility`, { cache: "no-store" })
        const json = await res.json()
        const map: Record<string, boolean> = {}
        ;(json.entries as Array<{ student_email: string; visible: boolean }>)?.forEach((e) => {
          map[e.student_email] = !!e.visible
        })
        setVisMap(map)
      } catch {}
    }
    run()
  }, [materialId])

  const save = async () => {
    setSaving(true)
    try {
      const entries = students.map((s) => ({ student_email: s.email, visible: !!visMap[s.email] }))
      await fetch(`/api/materials/${materialId}/visibility`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <TeacherLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Button>
        </div>

        <Card className="border-0 bg-card/80 backdrop-blur">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">公開設定（生徒ごと）</CardTitle>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <BookOpen className="h-3 w-3" />
                  <span>{materialTitle}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {students.map((s) => (
                <div key={s.email} className="flex items-center justify-between border-b py-2">
                  <div>
                    <div className="font-medium text-foreground">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.email}</div>
                  </div>
                  <Switch checked={!!visMap[s.email]} onCheckedChange={(v) => setVisMap({ ...visMap, [s.email]: v })} />
                </div>
              ))}
              {students.length === 0 && <div className="text-sm text-muted-foreground">生徒がいません</div>}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => router.back()}>キャンセル</Button>
              <Button onClick={save} disabled={saving}>{saving ? "保存中..." : "保存"}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  )
}

