"use client"

import { useEffect, useState } from "react"
import { TeacherLayout } from "@/components/teacher-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Student } from "@/lib/types"
import { useAuthStore } from "@/lib/store"
import { Plus, Trash2, Save } from "lucide-react"

type Draft = Omit<Student, "id" | "createdAt" | "updatedAt"> & { id?: string }

export default function StudentsPage() {
  const { user } = useAuthStore()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [draft, setDraft] = useState<Draft>({ name: "", grade: "1-2", email: "", parentContact: "" })
  const [initialPassword, setInitialPassword] = useState("")

  const isTeacher = user?.role === "teacher"

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/students")
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || `Failed to load: ${res.status}`)
      }
      const json = await res.json()
      setStudents(json.students ?? [])
    } catch (e: any) {
      setError(e?.message || "読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const createOrUpdate = async () => {
    setLoading(true)
    setError("")
    try {
      const init: RequestInit = {
        method: draft.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, initialPassword: draft.id ? undefined : initialPassword || undefined }),
      }
      const endpoint = draft.id ? `/api/students/${draft.id}` : "/api/students"
      const res = await fetch(endpoint, init)
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || `Save failed: ${res.status}`)
      }
      setDraft({ name: "", grade: "1-2", email: "", parentContact: "" })
      setInitialPassword("")
      await load()
    } catch (e: any) {
      setError(e?.message || "保存に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const remove = async (id: string) => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/students/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const t = await res.text()
        throw new Error(t || `Delete failed: ${res.status}`)
      }
      await load()
    } catch (e: any) {
      setError(e?.message || "削除に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (s: Student) => {
    setDraft({ id: s.id, name: s.name, grade: s.grade, email: s.email, parentContact: s.parentContact })
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">生徒管理</h1>
          <p className="text-muted-foreground">生徒の追加・編集・削除を行います</p>
        </div>

        <Card className="border-0 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle>生徒の登録/編集</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            {error && (
              <div className="md:col-span-4 text-red-600 text-sm">{error}</div>
            )}
            <div className="space-y-2">
              <Label>名前</Label>
              <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>学年</Label>
              <select
                className="h-10 rounded-md border px-3 bg-background"
                value={draft.grade}
                onChange={(e) => setDraft((d) => ({ ...d, grade: e.target.value as Draft["grade"] }))}
              >
                <option value="1-2">1-2年</option>
                <option value="3-4">3-4年</option>
                <option value="5-6">5-6年</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>メール</Label>
              <Input value={draft.email ?? ""} onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))} />
            </div>
            {!draft.id && (
              <div className="space-y-2">
                <Label>初期パスワード（新規作成時のみ）</Label>
                <Input type="password" value={initialPassword} onChange={(e) => setInitialPassword(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label>保護者連絡先</Label>
              <Input
                value={draft.parentContact ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, parentContact: e.target.value }))}
              />
            </div>
            <div className="md:col-span-4 flex gap-2 justify-end">
              <Button onClick={createOrUpdate} disabled={loading || !draft.name.trim()}>
                <Save className="h-4 w-4 mr-2" /> {draft.id ? "更新" : "追加"}
              </Button>
              {draft.id && (
                <Button variant="outline" onClick={() => setDraft({ name: "", grade: "1-2", email: "", parentContact: "" })}>
                  キャンセル
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle>生徒一覧</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2">名前</th>
                    <th className="py-2">学年</th>
                    <th className="py-2">メール</th>
                    <th className="py-2">保護者連絡先</th>
                    <th className="py-2 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="py-2">{s.name}</td>
                      <td className="py-2">{s.grade}</td>
                      <td className="py-2">{s.email}</td>
                      <td className="py-2">{s.parentContact}</td>
                      <td className="py-2 text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => (window.location.href = `/admin/students/${s.id}/materials`)}
                        >
                          公開教材
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => startEdit(s)}>編集</Button>
                        <Button size="sm" variant="destructive" onClick={() => remove(s.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length === 0 && <div className="text-center text-muted-foreground py-6">生徒がいません</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  )
}
