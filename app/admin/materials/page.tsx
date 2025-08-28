"use client"

import type React from "react"

import { TeacherLayout } from "@/components/teacher-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { BookOpen, Search, Plus, Edit, Trash2, Upload, Eye, Clock, Tag, Users } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useDataStore } from "@/lib/store"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Switch } from "@/components/ui/switch"
import type { Material } from "@/lib/types"

export default function AdminMaterialsPage() {
  const { materials, addMaterial, updateMaterial, deleteMaterial, initializeData, setMaterials } = useDataStore() as any
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGrade, setSelectedGrade] = useState<string>("all")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isVisibilityDialogOpen, setIsVisibilityDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [visibilityMaterial, setVisibilityMaterial] = useState<Material | null>(null)
  const [students, setStudents] = useState<Array<{ email: string; name: string }>>([])
  const [visMap, setVisMap] = useState<Record<string, boolean>>({})
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    grade: "1-2" as const,
    level: "easy" as const,
    tags: "",
    htmlContent: "",
  })

  useEffect(() => {
    // 初期はローカルのモックで埋め、その後Supabaseから最新を取得
    initializeData()
    const load = async () => {
      try {
        const res = await fetch("/api/materials", { cache: "no-store" })
        if (!res.ok) return
        const { materials } = await res.json()
        if (Array.isArray(materials)) setMaterials(materials)
      } catch {}
    }
    load()
  }, [initializeData, setMaterials])

  // 生徒一覧の取得（公開設定ダイアログ用）
  useEffect(() => {
    const run = async () => {
      try {
        const supabase = getSupabaseClient()
        const { data } = await supabase.from("students").select("email,name").order("name", { ascending: true })
        setStudents(((data as any[]) || []).map((r) => ({ email: r.email, name: r.name })))
      } catch {}
    }
    run()
  }, [])

  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      const matchesSearch =
        material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        material.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesGrade = selectedGrade === "all" || material.grade === selectedGrade
      const matchesLevel = selectedLevel === "all" || material.level === selectedLevel

      return matchesSearch && matchesGrade && matchesLevel
    })
  }, [materials, searchQuery, selectedGrade, selectedLevel])

  const getLevelColor = (level: string) => {
    switch (level) {
      case "easy":
        return "bg-green-100 text-green-800"
      case "normal":
        return "bg-yellow-100 text-yellow-800"
      case "hard":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getLevelText = (level: string) => {
    switch (level) {
      case "easy":
        return "かんたん"
      case "normal":
        return "ふつう"
      case "hard":
        return "むずかしい"
      default:
        return level
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      grade: "1-2",
      level: "easy",
      tags: "",
      htmlContent: "",
    })
  }

  const handleCreateMaterial = async () => {
    if (!formData.title.trim() || !formData.htmlContent.trim()) return

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      grade: formData.grade,
      level: formData.level,
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      htmlContent: formData.htmlContent,
    }

    try {
      const res = await fetch("/api/materials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      if (res.ok) {
        const { id } = await res.json()
        const now = new Date().toISOString()
        const newMaterial: Material = { id, createdAt: now, updatedAt: now, thumbnailUrl: undefined, ...payload }
        addMaterial(newMaterial)
      }
    } catch {}
    setIsCreateDialogOpen(false)
    resetForm()
  }

  const handleEditMaterial = async () => {
    if (!editingMaterial || !formData.title.trim() || !formData.htmlContent.trim()) return

    const updatedMaterial: Partial<Material> = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      grade: formData.grade,
      level: formData.level,
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      htmlContent: formData.htmlContent,
      updatedAt: new Date().toISOString(),
    }

    try {
      await fetch(`/api/materials/${editingMaterial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMaterial),
      })
      updateMaterial(editingMaterial.id, updatedMaterial)
    } catch {}
    setIsEditDialogOpen(false)
    setEditingMaterial(null)
    resetForm()
  }

  const handleDeleteMaterial = async (materialId: string) => {
    if (confirm("この教材を削除してもよろしいですか？")) {
      try {
        await fetch(`/api/materials/${materialId}`, { method: "DELETE" })
        deleteMaterial(materialId)
      } catch {}
    }
  }

  const handleEditClick = (material: Material) => {
    setEditingMaterial(material)
    setFormData({
      title: material.title,
      description: material.description || "",
      grade: material.grade,
      level: material.level,
      tags: material.tags.join(", "),
      htmlContent: material.htmlContent,
    })
    setIsEditDialogOpen(true)
  }

  const handleOpenVisibility = async (material: Material) => {
    setVisibilityMaterial(material)
    try {
      const res = await fetch(`/api/materials/${material.id}/visibility`, { cache: "no-store" })
      const json = await res.json()
      const map: Record<string, boolean> = {}
      ;(json.entries as Array<{ student_email: string; visible: boolean }>)?.forEach((e) => {
        map[e.student_email] = !!e.visible
      })
      setVisMap(map)
    } catch {
      setVisMap({})
    }
    setIsVisibilityDialogOpen(true)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "text/html") {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setFormData((prev) => ({ ...prev, htmlContent: content }))
      }
      reader.readAsText(file)
    }
  }

  const handlePreviewMaterial = (material: Material) => {
    router.push(`/materials/${material.id}`)
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-primary/10 rounded-full p-4">
                <BookOpen className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">教材管理</h1>
              <p className="text-muted-foreground mt-2">教材の作成・編集・削除を行います</p>
            </div>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                新しい教材を追加
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新しい教材を作成</DialogTitle>
                <DialogDescription>教材の詳細情報を入力してください</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">タイトル *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="教材のタイトル"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grade">対象学年 *</Label>
                    <Select
                      value={formData.grade}
                      onValueChange={(value: any) => setFormData((prev) => ({ ...prev, grade: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-2">1-2年生</SelectItem>
                        <SelectItem value="3-4">3-4年生</SelectItem>
                        <SelectItem value="5-6">5-6年生</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="level">難易度 *</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value: any) => setFormData((prev) => ({ ...prev, level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">かんたん</SelectItem>
                        <SelectItem value="normal">ふつう</SelectItem>
                        <SelectItem value="hard">むずかしい</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">タグ（カンマ区切り）</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                      placeholder="算数, 計算, 基礎"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">説明</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="教材の説明"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="html-upload">HTMLファイルアップロード</Label>
                  <div className="flex gap-2">
                    <Input id="html-upload" type="file" accept=".html" onChange={handleFileUpload} className="flex-1" />
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <Upload className="h-4 w-4" />
                      アップロード
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="html-content">HTMLコンテンツ *</Label>
                  <Textarea
                    id="html-content"
                    value={formData.htmlContent}
                    onChange={(e) => setFormData((prev) => ({ ...prev, htmlContent: e.target.value }))}
                    placeholder="HTMLコンテンツを入力またはファイルをアップロード"
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleCreateMaterial}
                    disabled={!formData.title.trim() || !formData.htmlContent.trim()}
                  >
                    作成
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter */}
        <Card className="border-0 bg-card/80 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="教材を検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="学年を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべての学年</SelectItem>
                      <SelectItem value="1-2">1-2年生</SelectItem>
                      <SelectItem value="3-4">3-4年生</SelectItem>
                      <SelectItem value="5-6">5-6年生</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="難易度を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべての難易度</SelectItem>
                      <SelectItem value="easy">かんたん</SelectItem>
                      <SelectItem value="normal">ふつう</SelectItem>
                      <SelectItem value="hard">むずかしい</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Materials List */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((material) => (
            <Card
              key={material.id}
              className="border-0 bg-card/80 backdrop-blur group hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="bg-primary/10 rounded-lg p-3 mb-3">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <Badge className={getLevelColor(material.level)}>{getLevelText(material.level)}</Badge>
                </div>
                <CardTitle className="text-lg">{material.title}</CardTitle>
                <div className="mt-1">
                  <a
                    href={`/admin/materials/${material.id}/visibility`}
                    className="text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    公開設定（生徒ごと）
                  </a>
                </div>
                <CardDescription className="text-sm">{material.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {material.grade}年生
                  </Badge>
                  {material.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  更新：{new Date(material.updatedAt).toLocaleDateString("ja-JP")}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreviewMaterial(material)}
                    className="flex-1 gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    プレビュー
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEditClick(material)} className="gap-1">
                    <Edit className="h-3 w-3" />
                    編集
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteMaterial(material.id)}
                    className="gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                    削除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredMaterials.length === 0 && (
          <Card className="border-0 bg-card/80 backdrop-blur">
            <CardContent className="text-center py-12">
              <div className="bg-muted/50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {materials.length === 0 ? "教材がありません" : "検索結果がありません"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {materials.length === 0
                  ? "新しい教材を作成して始めましょう。"
                  : "検索条件を変更してもう一度お試しください。"}
              </p>
              {materials.length === 0 && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  最初の教材を作成
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>教材を編集</DialogTitle>
              <DialogDescription>教材の詳細情報を編集してください</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">タイトル *</Label>
                  <Input
                    id="edit-title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="教材のタイトル"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-grade">対象学年 *</Label>
                  <Select
                    value={formData.grade}
                    onValueChange={(value: any) => setFormData((prev) => ({ ...prev, grade: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2">1-2年生</SelectItem>
                      <SelectItem value="3-4">3-4年生</SelectItem>
                      <SelectItem value="5-6">5-6年生</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-level">難易度 *</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value: any) => setFormData((prev) => ({ ...prev, level: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">かんたん</SelectItem>
                      <SelectItem value="normal">ふつう</SelectItem>
                      <SelectItem value="hard">むずかしい</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tags">タグ（カンマ区切り）</Label>
                  <Input
                    id="edit-tags"
                    value={formData.tags}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                    placeholder="算数, 計算, 基礎"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">説明</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="教材の説明"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-html-content">HTMLコンテンツ *</Label>
                <Textarea
                  id="edit-html-content"
                  value={formData.htmlContent}
                  onChange={(e) => setFormData((prev) => ({ ...prev, htmlContent: e.target.value }))}
                  placeholder="HTMLコンテンツを入力"
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  キャンセル
                </Button>
                <Button onClick={handleEditMaterial} disabled={!formData.title.trim() || !formData.htmlContent.trim()}>
                  更新
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TeacherLayout>
  )
}
