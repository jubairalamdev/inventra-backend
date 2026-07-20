import "dotenv/config"
import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import rateLimit from "express-rate-limit"
import type { Request, Response, NextFunction } from "express"
import { GoogleGenerativeAI } from "@google/generative-ai"

const app = express()
const PORT = process.env.PORT || 4000
const MONGODB_URI = process.env.MONGODB_URI!

let client: MongoClient
let db: import("mongodb").Db
let initialized = false

async function init() {
  if (initialized) return
  client = new MongoClient(MONGODB_URI)
  await client.connect()
  db = client.db("inventra")
  console.log("Connected to MongoDB Atlas")

  await db.collection("products").createIndexes([
    { key: { name: "text", description: "text", tags: "text" } },
    { key: { category: 1 } },
    { key: { price: 1 } },
    { key: { rating: -1 } },
    { key: { brand: 1 } },
  ])
  await db.collection("cart").createIndex({ userId: 1 }, { unique: true })
  await db.collection("orders").createIndex({ userId: 1 })

  app.set("trust proxy", 1)
  app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
  app.use(express.json({ limit: "1mb" }))

  type Req = Request & { user?: any }

  const apiLimiter = rateLimit({ windowMs: 60_000, max: 100 })
  app.use("/api/", apiLimiter)

  app.use((req: Req, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`)
    next()
  })

  app.get("/api/health", async (_req: Req, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() })
  })

  function sanitize(v: any): any {
    if (typeof v === "object" && v !== null) {
      for (const key of Object.keys(v)) {
        if (key.startsWith("$")) delete v[key]
        else sanitize(v[key])
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
    if (!session) return res.status(403).json({ error: "Invalid session" })
    const user = await db.collection("user").findOne({ _id: new ObjectId(session.userId) })
    if (!user) return res.status(403).json({ error: "User not found" })
    req.user = user
    next()
  }

  // ─── Products ──────────────────────────────────────────

  app.get("/api/products", async (req: Req, res: Response) => {
    sanitize(req.query)
    const { category, brand, minPrice, maxPrice, minRating, search, sort, cursor, limit = "12" } = req.query as Record<string, string>

    const filter: any = {}
    if (category) filter.category = category
    if (brand) filter.brand = brand
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
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { _id: -1 },
      name: { name: 1 },
    }
    const sortOption = sortMap[sort] || { _id: -1 }

    const items = await db.collection("products").find(filter).sort(sortOption).limit(Number(limit)).toArray()
    const nextCursor = items.length === Number(limit) ? items[items.length - 1]._id : null

    const categories = await db.collection("products").distinct("category")
    const brands = await db.collection("products").distinct("brand")

    res.json({ items, nextCursor, categories, brands })
  })

  app.get("/api/products/:id", async (req: Req, res: Response) => {
    const item = await db.collection("products").findOne({ _id: new ObjectId(req.params.id as string) })
    if (!item) return res.status(404).json({ error: "Product not found" })
    res.json(item)
  })

  app.post("/api/products", verifyToken, async (req: Req, res: Response) => {
    sanitize(req.body)
    const { name, description, longDescription, price, category, brand, image_url, stock, specs, tags } = req.body
    if (!name || typeof name !== "string" || name.length > 200)
      return res.status(400).json({ error: "name is required (max 200 chars)" })
    if (price === undefined || isNaN(Number(price)) || Number(price) <= 0)
      return res.status(400).json({ error: "price must be a positive number" })
    if (!category || typeof category !== "string")
      return res.status(400).json({ error: "category is required" })
    if (req.user!.role !== "admin")
      return res.status(403).json({ error: "Admin only" })

    const product = {
      name,
      description: description || "",
      longDescription: longDescription || "",
      price: Number(price),
      category,
      brand: brand || "",
      image_url: image_url || "",
      stock: stock ?? 0,
      rating: 0,
      specs: specs || {},
      reviews: [],
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const result = await db.collection("products").insertOne(product)
    res.status(201).json({ _id: result.insertedId, ...product })
  })

  app.put("/api/products/:id", verifyToken, async (req: Req, res: Response) => {
    if (req.user!.role !== "admin") return res.status(403).json({ error: "Admin only" })
    sanitize(req.body)
    const { name, description, longDescription, price, category, brand, image_url, stock, specs, tags } = req.body
    const update: any = { updatedAt: new Date() }
    if (name !== undefined) update.name = name
    if (description !== undefined) update.description = description
    if (longDescription !== undefined) update.longDescription = longDescription
    if (price !== undefined) update.price = Number(price)
    if (category !== undefined) update.category = category
    if (brand !== undefined) update.brand = brand
    if (image_url !== undefined) update.image_url = image_url
    if (stock !== undefined) update.stock = stock
    if (specs !== undefined) update.specs = specs
    if (tags !== undefined) update.tags = tags

    const result = await db.collection("products").findOneAndUpdate(
      { _id: new ObjectId(req.params.id as string) },
      { $set: update },
      { returnDocument: "after" },
    )
    if (!result) return res.status(404).json({ error: "Product not found" })
    res.json(result)
  })

  app.delete("/api/products/:id", verifyToken, async (req: Req, res: Response) => {
    if (req.user!.role !== "admin") return res.status(403).json({ error: "Admin only" })
    const result = await db.collection("products").deleteOne({ _id: new ObjectId(req.params.id as string) })
    if (result.deletedCount === 0) return res.status(404).json({ error: "Product not found" })
    res.json({ message: "Product deleted" })
  })

  // ─── Cart ──────────────────────────────────────────────

  app.get("/api/cart", verifyToken, async (req: Req, res: Response) => {
    let cart: any = await db.collection("cart").findOne({ userId: new ObjectId(req.user!._id) })
    if (!cart) {
      cart = { userId: new ObjectId(req.user!._id), items: [] }
      await db.collection("cart").insertOne(cart)
    }
    const productIds = cart.items.map((i: any) => new ObjectId(i.productId))
    const products = await db.collection("products").find({ _id: { $in: productIds } }).toArray()
    const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]))
    const items = cart.items.map((i: any) => ({
      ...i,
      product: productMap[i.productId] || null,
    }))
    res.json({ items })
  })

  app.post("/api/cart/add", verifyToken, async (req: Req, res: Response) => {
    const { productId, quantity = 1 } = req.body
    if (!productId) return res.status(400).json({ error: "productId is required" })

    const product = await db.collection("products").findOne({ _id: new ObjectId(productId) })
    if (!product) return res.status(404).json({ error: "Product not found" })

    const cart: any = await db.collection("cart").findOneAndUpdate(
      { userId: new ObjectId(req.user!._id) },
      {
        $setOnInsert: { userId: new ObjectId(req.user!._id), items: [] },
      },
      { upsert: true, returnDocument: "after" },
    )
    if (!cart) return res.status(500).json({ error: "Cart error" })

    const existing = cart.items.find((i: any) => i.productId === productId)
    if (existing) {
      existing.quantity += quantity
    } else {
      cart.items.push({ productId, quantity, price: product.price, name: product.name })
    }
    await db.collection("cart").updateOne(
      { _id: cart._id },
      { $set: { items: cart.items } },
    )
    res.json({ items: cart.items })
  })

  app.put("/api/cart/update", verifyToken, async (req: Req, res: Response) => {
    const { productId, quantity } = req.body
    if (!productId || quantity === undefined) return res.status(400).json({ error: "productId and quantity required" })
    const cart: any = await db.collection("cart").findOne({ userId: new ObjectId(req.user!._id) })
    if (!cart) return res.status(404).json({ error: "Cart not found" })
    if (quantity <= 0) {
      cart.items = cart.items.filter((i: any) => i.productId !== productId)
    } else {
      const item = cart.items.find((i: any) => i.productId === productId)
      if (item) item.quantity = quantity
    }
    await db.collection("cart").updateOne({ _id: cart._id }, { $set: { items: cart.items } })
    res.json({ items: cart.items })
  })

  app.delete("/api/cart/remove/:productId", verifyToken, async (req: Req, res: Response) => {
    const cart: any = await db.collection("cart").findOne({ userId: new ObjectId(req.user!._id) })
    if (!cart) return res.status(404).json({ error: "Cart not found" })
    cart.items = cart.items.filter((i: any) => i.productId !== req.params.productId)
    await db.collection("cart").updateOne({ _id: cart._id }, { $set: { items: cart.items } })
    res.json({ items: cart.items })
  })

  // ─── Orders ────────────────────────────────────────────

  app.post("/api/orders", verifyToken, async (req: Req, res: Response) => {
    const { shippingAddress } = req.body
    if (!shippingAddress) return res.status(400).json({ error: "shippingAddress is required" })

    const cart: any = await db.collection("cart").findOne({ userId: new ObjectId(req.user!._id) })
    if (!cart || cart.items.length === 0) return res.status(400).json({ error: "Cart is empty" })

    const productIds = cart.items.map((i: any) => new ObjectId(i.productId))
    const products = await db.collection("products").find({ _id: { $in: productIds } }).toArray()
    const productMap = Object.fromEntries(products.map((p) => [p._id.toString(), p]))

    const orderItems = cart.items.map((i: any) => ({
      productId: i.productId,
      name: productMap[i.productId]?.name || i.name,
      price: productMap[i.productId]?.price || i.price,
      quantity: i.quantity,
    }))

    const total = orderItems.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0)

    const order = {
      userId: new ObjectId(req.user!._id),
      items: orderItems,
      total,
      status: "confirmed",
      shippingAddress,
      createdAt: new Date(),
    }
    const result = await db.collection("orders").insertOne(order)
    await db.collection("cart").updateOne({ _id: cart._id }, { $set: { items: [] } })
    res.status(201).json({ _id: result.insertedId, ...order })
  })

  app.get("/api/orders", verifyToken, async (req: Req, res: Response) => {
    const orders = await db.collection("orders").find({ userId: new ObjectId(req.user!._id) }).sort({ createdAt: -1 }).toArray()
    res.json({ orders })
  })

  app.get("/api/orders/admin", verifyToken, async (req: Req, res: Response) => {
    if (req.user!.role !== "admin") return res.status(403).json({ error: "Admin only" })
    const orders = await db.collection("orders").find().sort({ createdAt: -1 }).toArray()
    res.json({ orders })
  })

  app.put("/api/orders/:id/status", verifyToken, async (req: Req, res: Response) => {
    if (req.user!.role !== "admin") return res.status(403).json({ error: "Admin only" })
    const { status } = req.body
    const valid = ["confirmed", "shipped", "delivered", "cancelled"]
    if (!valid.includes(status)) return res.status(400).json({ error: `Status must be one of: ${valid.join(", ")}` })
    const order = await db.collection("orders").findOneAndUpdate(
      { _id: new ObjectId(req.params.id as string) },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: "after" },
    )
    if (!order) return res.status(404).json({ error: "Order not found" })
    res.json(order)
  })

  app.get("/api/orders/:id", verifyToken, async (req: Req, res: Response) => {
    const order = await db.collection("orders").findOne({ _id: new ObjectId(req.params.id as string) })
    if (!order) return res.status(404).json({ error: "Order not found" })
    if (order.userId.toString() !== req.user!._id.toString() && req.user!.role !== "admin")
      return res.status(403).json({ error: "Not authorized" })
    res.json(order)
  })

  // ─── AI ────────────────────────────────────────────────

  const aiLimiter = rateLimit({ windowMs: 60_000, max: 20 })

  async function callGemini(prompt: string): Promise<{ text: string } | { error: string }> {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" })
      const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
      return { text: result.response.text().replace(/```json|```/g, "").trim() }
    } catch (err: any) {
      console.error("Gemini API error:", err.message)
      return { error: err.message || "Unknown Gemini error" }
    }
  }

  app.post("/api/ai/recommend", verifyToken, aiLimiter, async (req: Req, res: Response) => {
    const { productId, category, limit = 4 } = req.body

    let filter: any = {}
    if (category) filter.category = category
    if (productId) filter._id = { $ne: new ObjectId(productId) }

    const candidates = await db.collection("products").find(filter).sort({ rating: -1 }).limit(20).toArray()
    if (candidates.length === 0) return res.json({ recommendations: [] })

    const snippet = candidates.map((p) => `- ${p._id}: ${p.name} [${p.category}] $${p.price} rating=${p.rating}`).join("\n")
    const prompt = `Given these gaming gadgets:
${snippet}

Pick the top ${limit} items most likely to be bought together or viewed together. Return a JSON array of _id values: { "items": ["id1", "id2", ...] }`

    const geminiResult = await callGemini(prompt)

    if (!("error" in geminiResult)) {
      try {
        const parsed = JSON.parse(geminiResult.text)
        const items = await db.collection("products").find({ _id: { $in: parsed.items.map((id: string) => new ObjectId(id)) } }).toArray()
        return res.json({ recommendations: items })
      } catch {
        // fall through to fallback
      }
    }

    const fallback = candidates.slice(0, Number(limit))
    res.json({ recommendations: fallback })
  })

  // ─── Support Tickets ───────────────────────────────────

  app.get("/api/support/tickets", verifyToken, async (req: Req, res: Response) => {
    const tickets = await db.collection("tickets").find({ userId: new ObjectId(req.user!._id) }).sort({ createdAt: -1 }).toArray()
    res.json({ tickets })
  })

  app.post("/api/support/tickets", verifyToken, async (req: Req, res: Response) => {
    const { subject, description } = req.body
    if (!subject || !description) return res.status(400).json({ error: "subject and description required" })

    const ticket = {
      userId: new ObjectId(req.user!._id),
      subject,
      description,
      status: "Open",
      priority: "Medium",
      createdAt: new Date(),
    }
    const result = await db.collection("tickets").insertOne(ticket)
    res.status(201).json({ _id: result.insertedId, ...ticket })
  })

  // ─── Error handling ────────────────────────────────────

  app.use((_req: Req, res: Response) => {
    res.status(404).json({ error: "Not found" })
  })

  app.use((err: any, _req: Req, res: Response, _next: NextFunction) => {
    console.error(err)
    res.status(500).json({ error: "Internal server error" })
  })

  initialized = true
}

const isVercel = process.env.VERCEL === "1"

if (!isVercel) {
  init().then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  }).catch(console.error)
}

export default async function handler(req: Request, res: Response) {
  await init()
  app(req, res)
}

export { app, init }
