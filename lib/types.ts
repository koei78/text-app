export type Role = "student" | "teacher"

export type User = {
  id: string
  name: string
  email: string
  role: Role
}

export type Material = {
  id: string
  title: string
  grade: "1-2" | "3-4" | "5-6"
  level: "easy" | "normal" | "hard"
  tags: string[]
  htmlContent: string
  thumbnailUrl?: string
  description?: string
  createdAt: string
  updatedAt: string
}

export type Quiz = {
  id: string
  title: string
  level: "easy" | "normal" | "hard"
  description?: string
  questions: Question[]
  createdAt: string
  updatedAt: string
}

export type Question =
  | { id: string; type: "single"; text: string; choices: string[]; correctIndex: number; explanation?: string }
  | { id: string; type: "multiple"; text: string; choices: string[]; correctIndices: number[]; explanation?: string }
  | { id: string; type: "boolean"; text: string; answer: boolean; explanation?: string }
  | { id: string; type: "text"; text: string; rubricHint?: string }

export type QuizResult = {
  id: string
  quizId: string
  userId: string
  scoreAuto?: number
  answers: Record<string, unknown>
  submittedAt: string
}

export type ChatMessage = {
  id: string
  fromUserId: string
  toUserId: string
  text: string
  createdAt: string
  read?: boolean
}

export type Student = {
  id: string
  name: string
  grade: "1-2" | "3-4" | "5-6"
  email?: string
  parentContact?: string
  authUserId?: string
  createdAt: string
  updatedAt: string
}
