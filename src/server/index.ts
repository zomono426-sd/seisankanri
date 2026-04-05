import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createRouter } from './api/routes.js'
import { SessionStore } from './session.js'

const PORT = parseInt(process.env.PORT ?? '3001', 10)
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY ?? ''

if (!GOOGLE_API_KEY) {
  console.warn(
    '[WARNING] GOOGLE_API_KEY is not set. Gemini API calls will fail.\n' +
    'Copy .env.example to .env and set your API key.'
  )
}

const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// セッションストア
const sessions = new SessionStore(GOOGLE_API_KEY)

// APIルート
app.use('/api', createRouter(sessions, GOOGLE_API_KEY))

// ルートアクセス時の案内（開発時の誤アクセスを防ぐ）
app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'Backend API server is running.',
    frontend: 'http://localhost:5173/',
    health: '/health',
    apiBase: '/api',
  })
})

// ヘルスチェック
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║  🏭 PRODUCTION HELL — サーバー起動          ║
║  Port: ${PORT}                               ║
║  Gemini API: ${GOOGLE_API_KEY ? '✅ 設定済み' : '❌ 未設定'}             ║
╚══════════════════════════════════════════════╝
  `)
})
