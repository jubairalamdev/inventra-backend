import "dotenv/config"
import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import rateLimit from "express-rate-limit"
import type { Request, Response, NextFunction } from "express"

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

  type Req = Request & { user?: any }

  async function verifyToken(req: Req, res: Response, next: NextFunction) {
    const header = req.headers.authorization
    if (!header?.startsWith("Bearer "))
      return res.status(401).json({ error: "No token provided" })

    const token = header.split(" ")[1]
    const session = await db.collection("session").findOne({ token })
    if (!session)
      return res.status(403).json({ error: "Invalid or expired session" })

    const user = await db.collection("user").findOne({
      _id: new ObjectId(session.userId),
    })
    if (!user)
      return res.status(403).json({ error: "User not found" })

    req.user = user
    next()
  }

  function requireRole(...roles: string[]) {
    return (req: Req, res: Response, next: NextFunction) => {
      if (!req.user)
        return res.status(401).json({ error: "Unauthorized" })
      if (!roles.includes(req.user.role))
        return res.status(403).json({ error: "Insufficient permissions" })
      next()
    }
  }

  app.use((req: Req, res: Response, next: NextFunction) => {
    res.status(404).json({ error: "Not found" })
  })

  app.use((err: any, req: Req, res: Response, _next: NextFunction) => {
    console.error(err)
    res.status(500).json({ error: "Internal server error" })
  })

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

start().catch(console.error)
