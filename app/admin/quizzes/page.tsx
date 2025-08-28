"use client"

import { TeacherLayout } from "@/components/teacher-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Brain, Search, Plus, Edit, Trash2, Eye, Clock, FileText } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useDataStore } from "@/lib/store"

export default function AdminQuizzesPage() {
  const { quizzes, deleteQuiz, initializeData } = useDataStore()
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    initializeData()
  }, [initializeData])

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(
      (quiz) =>
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (quiz.description && quiz.description.toLowerCase().includes(searchQuery.toLowerCase())),
    )
  }, [quizzes, searchQuery])

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

  const handleDeleteQuiz = (quizId: string) => {
    if (confirm("このクイズを削除してもよろしいですか？")) {
      deleteQuiz(quizId)
    }
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-secondary/10 rounded-full p-4">
                <Brain className="h-12 w-12 text-secondary" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">クイズ管理</h1>
              <p className="text-muted-foreground mt-2">クイズの作成・編集・削除を行います</p>
            </div>
          </div>

          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            新しいクイズを作成
          </Button>
        </div>

        {/* Search */}
        <Card className="border-0 bg-card/80 backdrop-blur">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="クイズを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quizzes List */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
            <Card key={quiz.id} className="border-0 bg-card/80 backdrop-blur group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="bg-secondary/10 rounded-lg p-3 mb-3">
                    <Brain className="h-6 w-6 text-secondary" />
                  </div>
                  <Badge className={getLevelColor(quiz.level)}>{getLevelText(quiz.level)}</Badge>
                </div>
                <CardTitle className="text-lg">{quiz.title}</CardTitle>
                <CardDescription className="text-sm">{quiz.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {quiz.questions.length}問
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(quiz.updatedAt).toLocaleDateString("ja-JP")}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1 bg-transparent">
                    <Eye className="h-3 w-3" />
                    プレビュー
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1 bg-transparent">
                    <Edit className="h-3 w-3" />
                    編集
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteQuiz(quiz.id)}
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
        {filteredQuizzes.length === 0 && (
          <Card className="border-0 bg-card/80 backdrop-blur">
            <CardContent className="text-center py-12">
              <div className="bg-muted/50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Brain className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {quizzes.length === 0 ? "クイズがありません" : "検索結果がありません"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {quizzes.length === 0
                  ? "新しいクイズを作成して始めましょう。"
                  : "検索条件を変更してもう一度お試しください。"}
              </p>
              {quizzes.length === 0 && (
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  最初のクイズを作成
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </TeacherLayout>
  )
}
