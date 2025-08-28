import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Material, Quiz, QuizResult, ChatMessage } from "./types"
import { MOCK_MATERIALS, MOCK_QUIZZES, MOCK_CHAT_MESSAGES } from "./mock-data"
import { getSupabaseClient } from "@/lib/supabase/client"

interface AuthState {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

interface DataState {
  materials: Material[]
  quizzes: Quiz[]
  quizResults: QuizResult[]
  chatMessages: ChatMessage[]
  setMaterials: (materials: Material[]) => void
  addMaterial: (material: Material) => void
  updateMaterial: (id: string, material: Partial<Material>) => void
  deleteMaterial: (id: string) => void
  setQuizzes: (quizzes: Quiz[]) => void
  addQuiz: (quiz: Quiz) => void
  updateQuiz: (id: string, quiz: Partial<Quiz>) => void
  deleteQuiz: (id: string) => void
  addQuizResult: (result: QuizResult) => void
  addChatMessage: (message: ChatMessage) => void
  markMessageAsRead: (messageId: string) => void
  initializeData: () => void
}

const DUMMY_USERS: User[] = [
  { id: "student@example.com", name: "生徒デモ", email: "student@example.com", role: "student" },
  { id: "teacher@example.com", name: "田中先生", email: "teacher@example.com", role: "teacher" },
]

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: async (email: string, password: string) => {
        // Try Supabase Auth first (so DB features like chat/history work)
        try {
          const supabase = getSupabaseClient()
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (!error && data?.user) {
            // Map teacher by email, others as student
            const role: User["role"] = email === "teacher@example.com" ? "teacher" : "student"
            // Try to resolve display name from students table
            let display = email
            const { data: rows } = await supabase.from("students").select("name").eq("email", email).limit(1)
            if (rows && rows[0]?.name) display = rows[0].name
            set({ user: { id: email, name: role === "teacher" ? "田中先生" : display, email, role } })
            return true
          }
        } catch {
          // fall through to demo
        }

        // Fallback: demo users (local only)
        const demo = DUMMY_USERS.find((u) => u.email === email)
        if (demo && password === "pass1234") {
          set({ user: demo })
          return true
        }
        return false
      },
      logout: () => set({ user: null }),
    }),
    { name: "auth-storage" },
  ),
)

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      materials: [],
      quizzes: [],
      quizResults: [],
      chatMessages: [],
      setMaterials: (materials) => set({ materials }),
      addMaterial: (material) => set((s) => ({ materials: [...s.materials, material] })),
      updateMaterial: (id, material) =>
        set((s) => ({ materials: s.materials.map((m) => (m.id === id ? { ...m, ...material } : m)) })),
      deleteMaterial: (id) => set((s) => ({ materials: s.materials.filter((m) => m.id !== id) })),
      setQuizzes: (quizzes) => set({ quizzes }),
      addQuiz: (quiz) => set((s) => ({ quizzes: [...s.quizzes, quiz] })),
      updateQuiz: (id, quiz) => set((s) => ({ quizzes: s.quizzes.map((q) => (q.id === id ? { ...q, ...quiz } : q)) })),
      deleteQuiz: (id) => set((s) => ({ quizzes: s.quizzes.filter((q) => q.id !== id) })),
      addQuizResult: (result) => set((s) => ({ quizResults: [...s.quizResults, result] })),
      addChatMessage: (message) => set((s) => ({ chatMessages: [...s.chatMessages, message] })),
      markMessageAsRead: (messageId) =>
        set((s) => ({ chatMessages: s.chatMessages.map((m) => (m.id === messageId ? { ...m, read: true } : m)) })),
      initializeData: () => {
        const s = get()
        if (s.materials.length === 0) {
          set({ materials: MOCK_MATERIALS, quizzes: MOCK_QUIZZES, chatMessages: MOCK_CHAT_MESSAGES })
        }
      },
    }),
    { name: "data-storage" },
  ),
)
