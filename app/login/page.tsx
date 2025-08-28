"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { GraduationCap, BookOpen, Users } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    const ok = await login(email, password)
    if (ok) router.push("/")
    else setError("メールまたはパスワードが正しくありません")
    setIsLoading(false)
  }

  const handleDemo = async (demoEmail: string) => {
    setIsLoading(true)
    setError("")
    const ok = await login(demoEmail, "pass1234")
    if (ok) router.push("/")
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-amber-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary rounded-full p-4">
              <GraduationCap className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">きらきらスクール</h1>
            <p className="text-muted-foreground mt-2">楽しく学ぼう！</p>
          </div>
        </div>

        <Card className="shadow-lg border-0 bg-card/80 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">ログイン</CardTitle>
            <CardDescription>デモパスワード: pass1234</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-destructive text-sm text-center">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "ログイン中..." : "ログイン"}
              </Button>
            </form>

            <div className="mt-6 space-y-2">
              <div className="text-center text-sm text-muted-foreground">デモアカウント</div>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => handleDemo("student@example.com")} disabled={isLoading}>
                <BookOpen className="h-5 w-5 text-primary" /> 生徒としてログイン
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => handleDemo("teacher@example.com")} disabled={isLoading}>
                <Users className="h-5 w-5 text-secondary" /> 先生としてログイン
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

