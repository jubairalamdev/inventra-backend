import "dotenv/config"
import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import rateLimit from "express-rate-limit"

const app = express()
const PORT = process.env.PORT || 4000
const MONGODB_URI = process.env.MONGODB_URI!

const client = new MongoClient(MONGODB_URI)
let db: import("mongodb").Db

async function start() {
  await client.connect()
  db = client.db()
  console.log("Connected to MongoDB Atlas")

  await db.collection("product").createIndexes([
    { key: { title: "text", shortDescription: "text", tags: "text" } },
    { key: { category: 1 } },
    { key: { price: 1 } },
    { key: { rating: -1 } },
    { key: { tags: 1 } },
    { key: { vendorId: 1 } },
  ])
  console.log("Indexes created")

  app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
  app.use(express.json())

  const apiLimiter = rateLimit({ windowMs: 60_000, max: 100 })
  app.use("/api/", apiLimiter)

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

start().catch(console.error)
