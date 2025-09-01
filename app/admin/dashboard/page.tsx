"use client"

import { TeacherLayout } from "@/components/teacher-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  BookOpen,
  Brain,
  MessageCircle,
  Users,
  TrendingUp,
  Clock,
  Award,
  AlertCircle,
  Calendar,
  ArrowRight,
} from "lucide-react"
import { useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useDataStore, useAuthStore } from "@/lib/store"

export default function AdminDashboardPage() {
  const { materials, quizzes, quizResults, chatMessages, initializeData } = useDataStore()
  const { user } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    initializeData()
  }, [initializeData])

  // Calculate dashboard statistics
  const stats = useMemo(() => {
    const totalMaterials = materials.length
    const totalQuizzes = quizzes.length
    const totalQuizAttempts = quizResults.length

    // Calculate average quiz score
    const averageScore =
      quizResults.length > 0
        ? Math.round(quizResults.reduce((sum, result) => sum + (result.scoreAuto || 0), 0) / quizResults.length)
        : 0

    // Count unread messages from students
    const unreadMessages = chatMessages.filter((msg) => msg.toUserId === user?.id && !msg.read).length

    // Recent activity (last 7 days)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const recentQuizAttempts = quizResults.filter((result) => new Date(result.submittedAt) > oneWeekAgo).length

    const recentMessages = chatMessages.filter((msg) => new Date(msg.createdAt) > oneWeekAgo).length

    // Active students (students who have taken quizzes or sent messages)
    const activeStudentIds = new Set([
      ...quizResults.map((result) => result.userId),
      ...chatMessages.map((msg) => msg.fromUserId),
    ])
    const activeStudents = activeStudentIds.size

    return {
      totalMaterials,
      totalQuizzes,
      totalQuizAttempts,
      averageScore,
      unreadMessages,
      recentQuizAttempts,
      recentMessages,
      activeStudents,
    }
  }, [materials, quizzes, quizResults, chatMessages, user])

  // Recent quiz results for display
  const recentQuizResults = useMemo(() => {
    return quizResults
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 5)
      .map((result) => {
        const quiz = quizzes.find((q) => q.id === result.quizId)
        return {
          ...result,
          quizTitle: quiz?.title || "不明なクイズ",
          studentName: result.userId === "1" ? "たろうくん" : "生徒",
        }
      })
  }, [quizResults, quizzes])

  // Recent messages for display
  const recentMessages = useMemo(() => {
    return chatMessages
      .filter((msg) => msg.toUserId === user?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((msg) => ({
        ...msg,
        studentName: msg.fromUserId === "1" ? "たろうくん" : "生徒",
      }))
  }, [chatMessages, user])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  return (
    <TeacherLayout>
      <div className="relative space-y-6 bg-orange-200 overflow-hidden">
        {/* 斜め等間隔の玉模様 */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-orange-400/40"
            style={{
              width: '80px',
              height: '80px',
              top: `${40 + i * 120}px`,
              left: `${-40 + i * 160}px`,
              transform: 'rotate(-20deg)',
              zIndex: 0,
            }}
          />
        ))}
        {/* Header */}
        <div className="text-center space-y-6 pt-8">
          <div className="flex justify-center">
            <div className="bg-gradient-to-tr from-pink-300 via-blue-300 to-yellow-300 rounded-full p-6 shadow-lg">
              <BarChart3 className="h-16 w-16 text-white drop-shadow" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-extrabold text-pink-600 drop-shadow">ダッシュボード</h1>
            <p className="text-lg text-blue-500 mt-2 font-semibold">生徒の学習状況を確認しましょう</p>
          </div>
        </div>

        {/* Quick Stats */}
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
          <Card className="border-0 bg-gradient-to-tr from-pink-200 via-blue-200 to-yellow-200 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">教材数</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalMaterials}</p>
                </div>
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-tr from-blue-200 via-pink-200 to-yellow-200 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">クイズ数</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalQuizzes}</p>
                </div>
                <Brain className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-tr from-yellow-200 via-pink-200 to-blue-200 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">アクティブ生徒</p>
                  <p className="text-2xl font-bold text-foreground">{stats.activeStudents}</p>
                </div>
                <Users className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-tr from-green-200 via-blue-200 to-pink-200 shadow-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">平均スコア</p>
                  <p className="text-2xl font-bold text-foreground">{stats.averageScore}%</p>
                </div>
                <Award className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Overview */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card className="border-0 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                今週の活動
              </CardTitle>
              <CardDescription>過去7日間の学習活動</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Brain className="h-5 w-5 text-secondary" />
                  <span className="font-medium">クイズ挑戦</span>
                </div>
                <Badge variant="secondary">{stats.recentQuizAttempts}回</Badge>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-accent" />
                  <span className="font-medium">メッセージ</span>
                </div>
                <Badge variant="secondary">{stats.recentMessages}件</Badge>
              </div>
              {stats.unreadMessages > 0 && (
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">未読メッセージ</span>
                  </div>
                  <Badge variant="destructive">{stats.unreadMessages}件</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-0 bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                クイック操作
              </CardTitle>
              <CardDescription>よく使う機能へのショートカット</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 bg-transparent"
                onClick={() => router.push("/admin/materials")}
              >
                <BookOpen className="h-5 w-5 text-primary" />
                新しい教材を追加
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 bg-transparent"
                onClick={() => router.push("/admin/quizzes")}
              >
                <Brain className="h-5 w-5 text-secondary" />
                新しいクイズを作成
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-3 h-12 bg-transparent"
                onClick={() => router.push("/admin/chats")}
              >
                <MessageCircle className="h-5 w-5 text-accent" />
                生徒とのチャット
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Quiz Results */}
        <Card className="border-0 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-secondary" />
              最近のクイズ結果
            </CardTitle>
            <CardDescription>生徒の最新のクイズ成績</CardDescription>
          </CardHeader>
          <CardContent>
            {recentQuizResults.length > 0 ? (
              <div className="space-y-4">
                {recentQuizResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-foreground">{result.studentName}</span>
                        <Badge variant="outline" className="text-xs">
                          {result.quizTitle}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(result.submittedAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getScoreBadgeVariant(result.scoreAuto || 0)} className="mb-2">
                        {result.scoreAuto || 0}点
                      </Badge>
                      <div className="w-24">
                        <Progress value={result.scoreAuto || 0} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full mt-4 bg-transparent"
                  onClick={() => router.push("/admin/quizzes")}
                >
                  すべての結果を見る
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">まだクイズ結果がありません</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card className="border-0 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-accent" />
              最近のメッセージ
            </CardTitle>
            <CardDescription>生徒からの最新メッセージ</CardDescription>
          </CardHeader>
          <CardContent>
            {recentMessages.length > 0 ? (
              <div className="space-y-4">
                {recentMessages.map((message) => (
                  <div key={message.id} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <div className="bg-secondary rounded-full p-2 flex-shrink-0">
                      <Users className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">{message.studentName}</span>
                        {!message.read && (
                          <Badge variant="destructive" className="text-xs">
                            未読
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{message.text}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full mt-4 bg-transparent"
                  onClick={() => router.push("/admin/chats")}
                >
                  すべてのメッセージを見る
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">まだメッセージがありません</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="border-0 bg-gradient-to-r from-green-50 to-blue-50 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground mb-2">システム状況</h3>
                <p className="text-sm text-muted-foreground">すべてのシステムが正常に動作しています</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">正常</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TeacherLayout>
  )
}
