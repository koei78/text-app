import type { Material, Quiz, ChatMessage } from "./types"

export const MOCK_MATERIALS: Material[] = [
  {
    id: "m1",
    title: "たし算の基本",
    grade: "1-2",
    level: "easy",
    tags: ["算数", "たし算"],
    htmlContent: "<h2>たし算の基本</h2><p>1 + 1 = 2 など、かんたんなたし算をれんしゅうしましょう。</p>",
    thumbnailUrl: "/clock-time-learning-colorful.png",
    description: "1桁のたし算を学びます。",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "m2",
    title: "ひらがなをおぼえよう",
    grade: "1-2",
    level: "normal",
    tags: ["国語", "ひらがな"],
    htmlContent: "<h2>ひらがな</h2><p>あ・い・う・え・お の読み方をおぼえよう。</p>",
    thumbnailUrl: "/hiragana-japanese-characters-colorful.png",
    description: "ひらがなの読み方を学びます。",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const MOCK_QUIZZES: Quiz[] = [
  {
    id: "qz1",
    title: "たし算クイズ",
    level: "easy",
    description: "1桁のたし算にチャレンジ",
    questions: [
      { id: "q1", type: "single", text: "2 + 3 = ?", choices: ["4", "5", "6"], correctIndex: 1, explanation: "2 + 3 = 5" },
      { id: "q2", type: "boolean", text: "1 + 4 = 6", answer: false, explanation: "1 + 4 = 5" },
      { id: "q3", type: "text", text: "4 + 3 = ?", rubricHint: "7" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "c1",
    fromUserId: "1",
    toUserId: "2",
    text: "先生、宿題のしつもんがあります。",
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    read: false,
  },
]

