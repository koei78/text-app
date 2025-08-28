"use client"

import { StudentLayout } from "@/components/student-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Search, Filter, Clock, CheckCircle2 } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useDataStore, useAuthStore } from "@/lib/store"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function MaterialsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGrade, setSelectedGrade] = useState<string>("all")
  const [selectedLevel, setSelectedLevel] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  const { materials, initializeData, setMaterials } = useDataStore() as any
  const { user } = useAuthStore()
  const router = useRouter()
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [showOnlyUncompleted, setShowOnlyUncompleted] = useState(false)

  useEffect(() => {
    initializeData()
  }, [initializeData])

  useEffect(() => {
    const loadForStudent = async () => {
      try {
        if (!user?.email) return
        const res = await fetch(`/api/students/materials?email=${encodeURIComponent(user.email)}`, { cache: "no-store" })
        if (!res.ok) return
        const { materials } = await res.json()
        if (Array.isArray(materials)) setMaterials(materials)
      } catch {}
    }
    loadForStudent()
  }, [user, setMaterials])

  useEffect(() => {
    const loadCompletions = async () => {
      try {
        if (!user?.email) return
        const res = await fetch(`/api/students/completions?email=${encodeURIComponent(user.email)}`, { cache: "no-store" })
        if (!res.ok) return
        const { completedIds } = await res.json()
        if (Array.isArray(completedIds)) setCompletedIds(completedIds)
      } catch {}
    }
    loadCompletions()
  }, [user])

  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      if (showOnlyUncompleted && completedIds.includes(material.id)) return false
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

  const handleOpenMaterial = (materialId: string) => {
    router.push(`/materials/${materialId}`)
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 rounded-full p-4">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">教材一覧</h1>
            <p className="text-muted-foreground mt-2">好きな教材を選んで勉強しよう！</p>
          </div>
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
                <Button
                  variant="outline"
                  className="h-12 gap-2 bg-transparent"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4" />
                  絞り込み
                </Button>
                <Button variant={showOnlyUncompleted ? "secondary" : "outline"} className="h-12 gap-2" onClick={() => setShowOnlyUncompleted((v) => !v)}>
                  <CheckCircle2 className="h-4 w-4" />
                  未完了のみ
                </Button>
              </div>

              {showFilters && (
                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-foreground mb-2 block">学年</label>
                    <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="学年を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">すべて</SelectItem>
                        <SelectItem value="1-2">1-2年生</SelectItem>
                        <SelectItem value="3-4">3-4年生</SelectItem>
                        <SelectItem value="5-6">5-6年生</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-foreground mb-2 block">難易度</label>
                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="難易度を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">すべて</SelectItem>
                        <SelectItem value="easy">かんたん</SelectItem>
                        <SelectItem value="normal">ふつう</SelectItem>
                        <SelectItem value="hard">むずかしい</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Materials Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((material) => (
            <Card
              key={material.id}
              className="hover:shadow-lg transition-shadow cursor-pointer border-0 bg-card/80 backdrop-blur group"
              onClick={() => handleOpenMaterial(material.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="bg-primary/10 rounded-lg p-3 mb-3">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex gap-2 items-center">
                    {completedIds.includes(material.id) && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> 完了
                      </Badge>
                    )}
                    <Badge className={getLevelColor(material.level)}>{getLevelText(material.level)}</Badge>
                  </div>
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">{material.title}</CardTitle>
                <CardDescription className="text-sm">{material.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {material.grade}年生
                  </Badge>
                  {material.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(material.updatedAt).toLocaleDateString("ja-JP")}
                  </div>
                  <Button size="sm" className="h-8">
                    開く
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
              <p className="text-muted-foreground">
                {materials.length === 0
                  ? "まだ教材が登録されていません。"
                  : "検索条件を変更してもう一度お試しください。"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </StudentLayout>
  )
}
