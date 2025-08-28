"use client"

import { StudentLayout } from "@/components/student-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Brain, ArrowLeft, ArrowRight, CheckCircle, XCircle, Clock } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useDataStore, useAuthStore } from "@/lib/store"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useEffect, useState, useMemo } from "react"
import type { Question, QuizResult } from "@/lib/types"

export default function QuizTakingPage() {
  const router = useRouter()
  const params = useParams()
  const { quizzes, addQuizResult, initializeData, updateQuiz } = useDataStore() as any
  const { user } = useAuthStore()

  const quizId = params.id as string
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [startTime] = useState(new Date())

  useEffect(() => {
    initializeData()
    // Load quiz questions from Supabase if available
    const load = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("quiz_id", quizId)
          .order("idx", { ascending: true })
        if (error || !data) return
        const qs = data.map((r: any) => {
          switch (r.type) {
            case "single":
              return { id: r.id, type: "single", text: r.text, choices: r.choices ?? [], correctIndex: r.correct_index ?? 0 }
            case "multiple":
              return { id: r.id, type: "multiple", text: r.text, choices: r.choices ?? [], correctIndices: r.correct_indices ?? [] }
            case "boolean":
              return { id: r.id, type: "boolean", text: r.text, answer: !!r.answer_bool }
            default:
              return { id: r.id, type: "text", text: r.text, rubricHint: r.rubric_hint ?? undefined }
          }
        })
        updateQuiz(quizId, { questions: qs })
      } catch {}
    }
    load()
  }, [initializeData, quizId, updateQuiz])

  const quiz = useMemo(() => {
    return quizzes.find((q) => q.id === quizId)
  }, [quizzes, quizId])

  const currentQuestion = quiz?.questions[currentQuestionIndex]
  const progress = quiz ? ((currentQuestionIndex + 1) / quiz.questions.length) * 100 : 0

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleNext = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const calculateScore = () => {
    if (!quiz) return 0

    let correctAnswers = 0
    let totalAutoGradeable = 0

    quiz.questions.forEach((question) => {
      if (question.type === "text") return // Skip text questions for auto-scoring

      totalAutoGradeable++
      const userAnswer = answers[question.id]

      switch (question.type) {
        case "single":
          if (userAnswer === question.correctIndex.toString()) {
            correctAnswers++
          }
          break
        case "multiple":
          if (Array.isArray(userAnswer) && Array.isArray(question.correctIndices)) {
            const sortedUser = [...userAnswer].sort()
            const sortedCorrect = [...question.correctIndices.map(String)].sort()
            if (JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect)) {
              correctAnswers++
            }
          }
          break
        case "boolean":
          if (userAnswer === question.answer.toString()) {
            correctAnswers++
          }
          break
      }
    })

    return totalAutoGradeable > 0 ? Math.round((correctAnswers / totalAutoGradeable) * 100) : 0
  }

  const handleSubmit = async () => {
    if (!quiz || !user) return

    const score = calculateScore()
    const result: QuizResult = {
      id: `result_${Date.now()}`,
      quizId: quiz.id,
      userId: user.id,
      scoreAuto: score,
      answers,
      submittedAt: new Date().toISOString(),
    }

    addQuizResult(result)
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        await fetch("/api/quiz-attempts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId: quiz.id, userEmail: user.email, answers, scoreAuto: score }),
        })
      }
    } catch {}
    setIsSubmitted(true)
    setShowResults(true)
  }

  const isAnswered = (question: Question) => {
    const answer = answers[question.id]
    if (question.type === "multiple") {
      return Array.isArray(answer) && answer.length > 0
    }
    return answer !== undefined && answer !== ""
  }

  const isCorrect = (question: Question) => {
    const userAnswer = answers[question.id]

    switch (question.type) {
      case "single":
        return userAnswer === question.correctIndex.toString()
      case "multiple":
        if (Array.isArray(userAnswer) && Array.isArray(question.correctIndices)) {
          const sortedUser = [...userAnswer].sort()
          const sortedCorrect = [...question.correctIndices.map(String)].sort()
          return JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect)
        }
        return false
      case "boolean":
        return userAnswer === question.answer.toString()
      case "text":
        return true // Text questions are not auto-graded
      default:
        return false
    }
  }

  if (!quiz) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <div className="bg-muted/50 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <Brain className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">クイズが見つかりません</h2>
          <p className="text-muted-foreground mb-4">指定されたクイズは存在しないか、削除されています。</p>
          <Button onClick={() => router.push("/quiz")}>クイズ一覧に戻る</Button>
        </div>
      </StudentLayout>
    )
  }

  if (showResults) {
    const score = calculateScore()
    return (
      <StudentLayout>
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Results Header */}
          <Card className="border-0 bg-card/80 backdrop-blur">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div
                  className={`rounded-full p-4 ${score >= 80 ? "bg-green-100" : score >= 60 ? "bg-yellow-100" : "bg-red-100"}`}
                >
                  {score >= 80 ? (
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  ) : (
                    <Brain className="h-12 w-12 text-secondary" />
                  )}
                </div>
              </div>
              <CardTitle className="text-2xl text-foreground mb-2">クイズ完了！</CardTitle>
              <div className="text-center space-y-2">
                <p className="text-3xl font-bold text-primary">{score}点</p>
                <p className="text-muted-foreground">
                  {score >= 80 ? "素晴らしい！" : score >= 60 ? "よくできました！" : "もう一度挑戦してみよう！"}
                </p>
              </div>
            </CardHeader>
          </Card>

          {/* Question Results */}
          <div className="space-y-4">
            {quiz.questions.map((question, index) => (
              <Card key={question.id} className="border-0 bg-card/80 backdrop-blur">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {isCorrect(question) ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">問題 {index + 1}</CardTitle>
                      <p className="text-foreground mb-3">{question.text}</p>

                      {question.type === "single" && (
                        <div className="space-y-2">
                          {question.choices.map((choice, choiceIndex) => (
                            <div
                              key={choiceIndex}
                              className={`p-3 rounded-lg border ${
                                choiceIndex === question.correctIndex
                                  ? "bg-green-100 border-green-300"
                                  : answers[question.id] === choiceIndex.toString()
                                    ? "bg-red-100 border-red-300"
                                    : "bg-muted/50"
                              }`}
                            >
                              {choice}
                              {choiceIndex === question.correctIndex && (
                                <Badge className="ml-2 bg-green-600">正解</Badge>
                              )}
                              {answers[question.id] === choiceIndex.toString() &&
                                choiceIndex !== question.correctIndex && (
                                  <Badge className="ml-2 bg-red-600">あなたの回答</Badge>
                                )}
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === "boolean" && (
                        <div className="space-y-2">
                          <div
                            className={`p-3 rounded-lg border ${question.answer ? "bg-green-100 border-green-300" : "bg-muted/50"}`}
                          >
                            はい
                            {question.answer && <Badge className="ml-2 bg-green-600">正解</Badge>}
                            {answers[question.id] === "true" && !question.answer && (
                              <Badge className="ml-2 bg-red-600">あなたの回答</Badge>
                            )}
                          </div>
                          <div
                            className={`p-3 rounded-lg border ${!question.answer ? "bg-green-100 border-green-300" : "bg-muted/50"}`}
                          >
                            いいえ
                            {!question.answer && <Badge className="ml-2 bg-green-600">正解</Badge>}
                            {answers[question.id] === "false" && question.answer && (
                              <Badge className="ml-2 bg-red-600">あなたの回答</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {question.explanation && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>解説：</strong> {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/quiz")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              クイズ一覧に戻る
            </Button>
            <Button onClick={() => router.push(`/quiz/${quiz.id}`)} className="gap-2">
              もう一度挑戦
              <Brain className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </StudentLayout>
    )
  }

  if (!currentQuestion) return null

  return (
    <StudentLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push("/quiz")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            戻る
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            問題 {currentQuestionIndex + 1} / {quiz.questions.length}
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-foreground font-medium">{quiz.title}</span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <Card className="border-0 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl text-foreground mb-4">問題 {currentQuestionIndex + 1}</CardTitle>
            <p className="text-lg text-foreground">{currentQuestion.text}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Single Choice */}
            {currentQuestion.type === "single" && (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                {currentQuestion.choices.map((choice, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50">
                    <RadioGroupItem value={index.toString()} id={`choice-${index}`} />
                    <Label htmlFor={`choice-${index}`} className="flex-1 cursor-pointer text-base">
                      {choice}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {/* Multiple Choice */}
            {currentQuestion.type === "multiple" && (
              <div className="space-y-3">
                {currentQuestion.choices.map((choice, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={`choice-${index}`}
                      checked={(answers[currentQuestion.id] || []).includes(index.toString())}
                      onCheckedChange={(checked) => {
                        const currentAnswers = answers[currentQuestion.id] || []
                        const newAnswers = checked
                          ? [...currentAnswers, index.toString()]
                          : currentAnswers.filter((a: string) => a !== index.toString())
                        handleAnswerChange(currentQuestion.id, newAnswers)
                      }}
                    />
                    <Label htmlFor={`choice-${index}`} className="flex-1 cursor-pointer text-base">
                      {choice}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {/* Boolean */}
            {currentQuestion.type === "boolean" && (
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true" className="flex-1 cursor-pointer text-base">
                    はい
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false" className="flex-1 cursor-pointer text-base">
                    いいえ
                  </Label>
                </div>
              </RadioGroup>
            )}

            {/* Text Input */}
            {currentQuestion.type === "text" && (
              <div className="space-y-2">
                <Label htmlFor="text-answer" className="text-base">
                  答えを入力してください：
                </Label>
                <Input
                  id="text-answer"
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="ここに答えを入力..."
                  className="h-12 text-base"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="gap-2 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            前の問題
          </Button>

          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <Button onClick={handleSubmit} disabled={!isAnswered(currentQuestion)} className="gap-2">
              提出する
              <CheckCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!isAnswered(currentQuestion)} className="gap-2">
              次の問題
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </StudentLayout>
  )
}
