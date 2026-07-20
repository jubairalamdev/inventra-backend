import "dotenv/config"
import express from "express"
import cors from "cors"
import { MongoClient } from "mongodb"
import rateLimit from "express-rate-limit"

const app = express()
const PORT = process.env.PORT || 4000
const MONGODB_URI = process.env.MONGODB_URI!

let db: import("mongodb").Db

async function start() {
  const client = new MongoClient(MONGODB_URI)
  await client.connect()
  db = client.db()
  console.log("Connected to MongoDB Atlas")

  app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
  app.use(express.json())

  const apiLimiter = rateLimit({ windowMs: 60_000, max: 100 })
  app.use("/api/", apiLimiter)

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

start().catch(console.error)
