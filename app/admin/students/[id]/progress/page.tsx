"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { TeacherLayout } from "@/components/teacher-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle2, BookOpen } from "lucide-react"

type Material = { id: string; title: string; grade: string; level: string }

export default function StudentProgressPage() {
  const { id } = useParams()
  const router = useRouter()
  const studentId = String(id)
  const [student, setStudent] = useState<{ email: string; name: string } | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [completed, setCompleted] = useState<Set<string>>(new Set())

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/students/${studentId}`)
        const json = await res.json()
        if (json?.student) setStudent({ email: json.student.email, name: json.student.name })
      } catch {}
      try {
        const res = await fetch(`/api/materials`, { cache: "no-store" })
        const json = await res.json()
        setMaterials((json.materials || []).map((m: any) => ({ id: m.id, title: m.title, grade: m.grade, level: m.level })))
      } catch {}
      try {
        const res = await fetch(`/api/students/${studentId}/completions`, { cache: "no-store" })
        const json = await res.json()
        setCompleted(new Set(((json.completions as any[]) || []).map((r) => r.material_id)))
      } catch {}
    }
    load()
  }, [studentId])

  const completedCount = completed.size
  const total = materials.length

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
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{student?.name || "生徒"} の進捗</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">完了 {completedCount} / {total}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {materials.map((m) => (
                <div key={m.id} className="flex items-center justify-between border-b py-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{m.title}</span>
                  </div>
                  {completed.has(m.id) ? (
                    <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" /> 完了</Badge>
                  ) : (
                    <Badge variant="outline">未完了</Badge>
                  )}
                </div>
              ))}
              {materials.length === 0 && <div className="text-sm text-muted-foreground">教材がありません</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  )
}

