"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { TeacherLayout } from "@/components/teacher-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Users, BookOpen, Save } from "lucide-react"

type Material = {
  id: string
  title: string
  grade: string
  level: string
}

export default function StudentMaterialsManagePage() {
  const { id } = useParams()
  const router = useRouter()
  const studentId = String(id)
  const [student, setStudent] = useState<{ email: string; name: string } | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [mode, setMode] = useState<"all" | "none" | "custom">("custom")
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const run = async () => {
      // load student basic
      try {
        const res = await fetch(`/api/students/${studentId}`)
        const json = await res.json()
        if (json?.student) setStudent({ email: json.student.email, name: json.student.name })
      } catch {}
      // load materials
      try {
        const res = await fetch(`/api/materials`, { cache: "no-store" })
        const json = await res.json()
        setMaterials((json.materials || []).map((m: any) => ({ id: m.id, title: m.title, grade: m.grade, level: m.level })))
      } catch {}
      // load current policy
      try {
        const res = await fetch(`/api/students/${studentId}/materials`, { cache: "no-store" })
        const json = await res.json()
        if (json.mode) setMode(json.mode)
        const map: Record<string, boolean> = {}
        for (const id of (json.selectedIds || [])) map[id] = true
        setSelected(map)
      } catch {}
    }
    run()
  }, [studentId])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return materials
    return materials.filter((m) => m.title.toLowerCase().includes(q) || m.grade.includes(q) || m.level.includes(q))
  }, [materials, filter])

  const toggle = (id: string, v: boolean) => setSelected((s) => ({ ...s, [id]: v }))

  const save = async () => {
    setSaving(true)
    try {
      const selectedIds = Object.entries(selected)
        .filter(([, v]) => v)
        .map(([id]) => id)
      await fetch(`/api/students/${studentId}/materials`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, selectedIds }),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <TeacherLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
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
                <CardTitle className="text-xl">{student?.name || "生徒"} の教材公開設定</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">メール: {student?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>表示モード</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="mode" checked={mode === "all"} onChange={() => setMode("all")} />
                    すべて表示
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="mode" checked={mode === "none"} onChange={() => setMode("none")} />
                    すべて非表示
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="mode" checked={mode === "custom"} onChange={() => setMode("custom")} />
                    個別に選択
                  </label>
                </div>
              </div>

              {mode === "custom" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Input placeholder="教材を検索..." value={filter} onChange={(e) => setFilter(e.target.value)} />
                    <Button variant="outline" onClick={() => setSelected(Object.fromEntries(materials.map((m) => [m.id, true])))}>
                      全選択
                    </Button>
                    <Button variant="outline" onClick={() => setSelected({})}>
                      クリア
                    </Button>
                  </div>
                  <div className="max-h-[50vh] overflow-y-auto border rounded-md p-3 space-y-2">
                    {filtered.map((m) => (
                      <label key={m.id} className="flex items-center gap-2">
                        <input type="checkbox" checked={!!selected[m.id]} onChange={(e) => toggle(m.id, e.target.checked)} />
                        <span className="text-foreground">{m.title}</span>
                        <span className="text-xs text-muted-foreground">({m.grade}/{m.level})</span>
                      </label>
                    ))}
                    {filtered.length === 0 && <div className="text-sm text-muted-foreground">該当する教材がありません</div>}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => router.back()}>キャンセル</Button>
                <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? "保存中..." : "保存"}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  )
}

