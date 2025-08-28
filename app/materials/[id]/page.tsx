"use client"

import { StudentLayout } from "@/components/student-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ArrowLeft, Clock, User } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useDataStore } from "@/lib/store"
import { useEffect, useMemo } from "react"

export default function MaterialDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { materials, initializeData } = useDataStore()

  const materialId = params.id as string

  useEffect(() => {
    initializeData()
  }, [initializeData])

  const material = useMemo(() => {
    return materials.find((m) => m.id === materialId)
  }, [materials, materialId])

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

  if (!material) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <div className="bg-muted/50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">教材が見つかりません</h2>
          <p className="text-muted-foreground mb-4">指定された教材は存在しないか、削除されています。</p>
          <Button onClick={() => router.push("/materials")}>教材一覧に戻る</Button>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Button>
        </div>

        {/* Material Header */}
        <Card className="border-0 bg-card/80 backdrop-blur">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary/10 rounded-lg p-2">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <Badge className={getLevelColor(material.level)}>{getLevelText(material.level)}</Badge>
                </div>
                <CardTitle className="text-2xl text-foreground mb-2">{material.title}</CardTitle>
                <p className="text-muted-foreground mb-4">{material.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="gap-1">
                    <User className="h-3 w-3" />
                    {material.grade}年生
                  </Badge>
                  {material.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  更新日：{new Date(material.updatedAt).toLocaleDateString("ja-JP")}
                </div>
              </div>

              {material.thumbnailUrl && (
                <div className="w-full sm:w-48 h-32 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={material.thumbnailUrl || "/placeholder.svg"}
                    alt={material.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Material Content */}
        <Card className="border-0 bg-card/80 backdrop-blur">
          <CardContent className="p-8">
            <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: material.htmlContent }} />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/materials")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            教材一覧に戻る
          </Button>

          <Button onClick={() => router.push("/quiz")} className="gap-2">
            クイズに挑戦
            <BookOpen className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </StudentLayout>
  )
}
