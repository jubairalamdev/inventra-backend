import "dotenv/config"
import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import rateLimit from "express-rate-limit"
import type { Request, Response, NextFunction } from "express"
import OpenAI from "openai"
import { GoogleGenerativeAI } from "@google/generative-ai"
import Anthropic from "@anthropic-ai/sdk"

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

  app.set("trust proxy", 1)
  app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
  app.use(express.json({ limit: "1mb" }))

  const apiLimiter = rateLimit({ windowMs: 60_000, max: 100 })
  app.use("/api/", apiLimiter)

  type Req = Request & { user?: any }

  function sanitize(v: any): any {
    if (typeof v === "object" && v !== null) {
      for (const key of Object.keys(v)) {
        if (key.startsWith("$")) {
          delete v[key]
        } else {
          sanitize(v[key])
        }
      }
    }
    return v
  }

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

  app.get("/api/items", async (req: Req, res: Response) => {
    sanitize(req.query)
    const {
      category,
      minPrice,
      maxPrice,
      minRating,
      search,
      sort,
      cursor,
      limit = "12",
    } = req.query as Record<string, string>

    const filter: any = {}
    if (category) filter.category = category
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }
    if (minRating) filter.rating = { $gte: Number(minRating) }
    if (search) filter.$text = { $search: search }
    if (cursor) filter._id = { $lt: new ObjectId(cursor) }

    const sortMap: Record<string, any> = {
      rating: { rating: -1 },
      downloads: { downloads: -1 },
      price: { price: 1 },
      newest: { _id: -1 },
    }
    const sortOption = sortMap[sort] || { _id: -1 }

    const items = await db
      .collection("product")
      .find(filter)
      .sort(sortOption)
      .limit(Number(limit))
      .toArray()

    const nextCursor = items.length === Number(limit) ? items[items.length - 1]._id : null

    res.json({ items, nextCursor })
  })

  app.get("/api/items/:id", async (req: Req, res: Response) => {
    const item = await db.collection("product").findOne({
      _id: new ObjectId(req.params.id),
    })
    if (!item) return res.status(404).json({ error: "Product not found" })
    res.json(item)
  })

  app.post("/api/items", verifyToken, async (req: Req, res: Response) => {
    sanitize(req.body)
    const { title, shortDescription, fullDescription, price, category, tags } = req.body
    if (!title || typeof title !== "string" || title.length > 200)
      return res.status(400).json({ error: "title must be a string (max 200 chars)" })
    if (price === undefined || isNaN(Number(price)) || Number(price) <= 0)
      return res.status(400).json({ error: "price must be a positive number" })
    if (!category || typeof category !== "string")
      return res.status(400).json({ error: "category is required" })
    if (tags && (!Array.isArray(tags) || tags.some((t: any) => typeof t !== "string")))
      return res.status(400).json({ error: "tags must be an array of strings" })

    const item = {
      title,
      shortDescription: shortDescription || "",
      fullDescription: fullDescription || "",
      price: Number(price),
      category,
      tags: tags || [],
      rating: 0,
      vendorId: new ObjectId(req.user!._id),
      telemetry: {},
      createdAt: new Date(),
      downloads: 0,
    }
    const result = await db.collection("product").insertOne(item)
    res.status(201).json({ _id: result.insertedId, ...item })
  })

  app.delete("/api/items/:id", verifyToken, async (req: Req, res: Response) => {
    const item = await db.collection("product").findOne({
      _id: new ObjectId(req.params.id),
    })
    if (!item) return res.status(404).json({ error: "Product not found" })

    const isOwner = item.vendorId.toString() === req.user!._id.toString()
    const isAdmin = req.user!.role === "admin"
    if (!isOwner && !isAdmin)
      return res.status(403).json({ error: "Not authorized to delete this item" })

    await db.collection("product").deleteOne({ _id: new ObjectId(req.params.id) })
    res.json({ message: "Product deleted" })
  })

  const aiLimiter = rateLimit({ windowMs: 60_000, max: 20 })

  app.post("/api/ai/generate", verifyToken, aiLimiter, async (req: Req, res: Response) => {
    const { title, category, keywords, tone } = req.body
    if (!title)
      return res.status(400).json({ error: "title is required" })

    const prompt = `Generate a product listing for an AI agent asset.
Title: ${title}
Category: ${category || "general"}
Keywords: ${keywords?.join(", ") || "none"}
Tone: ${tone || "professional"}

Return JSON with:
- shortDescription (1-2 sentences)
- fullDescription (2-3 paragraphs, markdown)
- tags (array of 3-5 strings)`

    const provider = process.env.AI_PROVIDER || "openai"

    if (provider === "openai") {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        response_format: { type: "json_object" },
      })
      return res.json(JSON.parse(completion.choices[0].message.content!))
    }

    if (provider === "gemini") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
      const result = await model.generateContent(prompt + "\n\nRespond with JSON only.")
      const text = result.response.text().replace(/```json|```/g, "").trim()
      return res.json(JSON.parse(text))
    }

    if (provider === "claude") {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
      const msg = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      })
      return res.json(JSON.parse((msg.content[0] as any).text!))
    }

    res.status(500).json({ error: "No AI provider configured" })
  })

  app.post("/api/ai/recommend", verifyToken, aiLimiter, async (req: Req, res: Response) => {
    const { category, tags, limit = 4 } = req.body

    const filter: any = {}
    if (category) filter.category = category
    if (tags?.length) filter.tags = { $in: tags }

    const candidates = await db
      .collection("product")
      .find(filter)
      .sort({ rating: -1 })
      .limit(20)
      .toArray()

    if (candidates.length === 0)
      return res.json({ items: [] })

    const catalogSnippet = candidates
      .map((p) => `- ${p._id}: ${p.title} [${p.category}] rating=${p.rating}`)
      .join("\n")

    const prompt = `Given these available AI agent assets:
${catalogSnippet}

User context: category=${category || "any"}, tags=${tags?.join(",") || "any"}

Return a JSON array of up to ${limit} item _id values that best match the user's context. Format: { "items": ["id1", "id2", ...] }`

    const provider = process.env.AI_PROVIDER || "openai"

    if (provider === "openai") {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        response_format: { type: "json_object" },
      })
      const result = JSON.parse(completion.choices[0].message.content!)
      const items = await db
        .collection("product")
        .find({ _id: { $in: result.items.map((id: string) => new ObjectId(id)) } })
        .toArray()
      return res.json({ items })
    }

    if (provider === "gemini") {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
      const result = await model.generateContent(prompt + "\n\nRespond with JSON only.")
      const text = result.response.text().replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(text)
      const items = await db
        .collection("product")
        .find({ _id: { $in: parsed.items.map((id: string) => new ObjectId(id)) } })
        .toArray()
      return res.json({ items })
    }

    if (provider === "claude") {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
      const msg = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      })
      const parsed = JSON.parse((msg.content[0] as any).text!)
      const items = await db
        .collection("product")
        .find({ _id: { $in: parsed.items.map((id: string) => new ObjectId(id)) } })
        .toArray()
      return res.json({ items })
    }

    res.status(500).json({ error: "No AI provider configured" })
  })

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
