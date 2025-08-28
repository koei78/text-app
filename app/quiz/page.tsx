"use client"

import { StudentLayout } from "@/components/student-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Brain, Clock, FileText, Trophy } from "lucide-react"
import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useDataStore, useAuthStore } from "@/lib/store"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function QuizPage() {
  const { quizzes, quizResults, initializeData, setQuizzes } = useDataStore() as any
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    initializeData()
    const load = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
        const supabase = getSupabaseClient()
        const { data } = await supabase.from("quizzes").select("*").order("updatedat", { ascending: false })
        if (data) {
          setQuizzes(
            data.map((q: any) => ({
              id: q.id,
              title: q.title,
              level: q.level,
              description: q.description ?? undefined,
              questions: [],
              createdAt: q.createdat,
              updatedAt: q.updatedat,
            })),
          )
        }
      } catch {}
    }
    load()
  }, [initializeData])

  const userStats = useMemo(() => {
    if (!user) return { completed: 0, averageScore: 0, thisWeek: 0 }

    const userResults = quizResults.filter((result) => result.userId === user.id)
    const completed = userResults.length

    const averageScore =
      userResults.length > 0
        ? Math.round(userResults.reduce((sum, result) => sum + (result.scoreAuto || 0), 0) / userResults.length)
        : 0

    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const thisWeek = userResults.filter((result) => new Date(result.submittedAt) > oneWeekAgo).length

    return { completed, averageScore, thisWeek }
  }, [quizResults, user])

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

  const handleStartQuiz = (quizId: string) => {
    router.push(`/quiz/${quizId}`)
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-secondary/10 rounded-full p-4">
              <Brain className="h-12 w-12 text-secondary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">クイズ一覧</h1>
            <p className="text-muted-foreground mt-2">楽しいクイズで力試しをしよう！</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{userStats.completed}</p>
              <p className="text-sm text-muted-foreground">完了したクイズ</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-r from-secondary/10 to-secondary/5 backdrop-blur">
            <CardContent className="p-6 text-center">
              <Brain className="h-8 w-8 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{userStats.averageScore}%</p>
              <p className="text-sm text-muted-foreground">平均スコア</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-r from-accent/10 to-accent/5 backdrop-blur">
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{userStats.thisWeek}</p>
              <p className="text-sm text-muted-foreground">今週の挑戦</p>
            </CardContent>
          </Card>
        </div>

        {/* Quiz Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz, idx) => (
            <Card
              key={quiz.id}
              className="group relative border-0 overflow-hidden rounded-3xl shadow-md hover:shadow-2xl transition-all"
            >
              <div className="relative aspect-square">
                <img
                  src={idx % 2 === 0 ? "/math-addition-colorful.png" : "/clock-time-learning-colorful.png"}
                  alt={quiz.title}
                  className="absolute inset-0 h-full w-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20" />

                <div className="relative h-full w-full p-5 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div className="bg-secondary text-secondary-foreground rounded-lg p-2 shadow">
                      <Brain className="h-5 w-5" />
                    </div>
                    <Badge className={getLevelColor(quiz.level)}>{getLevelText(quiz.level)}</Badge>
                  </div>

                  <div className="mt-auto space-y-2">
                    <CardTitle className="text-lg group-hover:text-secondary transition-colors line-clamp-2">
                      {quiz.title}
                    </CardTitle>
                    <CardDescription className="text-sm line-clamp-2">{quiz.description}</CardDescription>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {quiz.questions.length}問
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />約{Math.ceil(quiz.questions.length * 1.5)}分
                      </div>
                    </div>
                    <Button variant="secondary" className="w-full h-10" onClick={() => handleStartQuiz(quiz.id)}>
                      挑戦する
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {quizzes.length === 0 && (
          <Card className="border-0 bg-card/80 backdrop-blur">
            <CardContent className="text-center py-12">
              <div className="bg-muted/50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Brain className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">クイズがありません</h3>
              <p className="text-muted-foreground">まだクイズが登録されていません。</p>
            </CardContent>
          </Card>
        )}
      </div>
    </StudentLayout>
  )
}
