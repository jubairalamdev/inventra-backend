import "dotenv/config"
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);
await client.connect();
const db = client.db();

const products = [
  {
    name: "Phantom X Pro Mechanical Keyboard",
    description: "Full-size mechanical keyboard with hot-swappable switches and per-key RGB lighting.",
    longDescription: "The Phantom X Pro features a CNC aluminum frame, Cherry MX Blue switches, and per-key addressable RGB. With N-key rollover and dedicated media controls, this keyboard is built for both competitive gaming and daily productivity.",
    price: 189.99, category: "Keyboards", brand: "Corsair", stock: 25,
    rating: 4.8, tags: ["mechanical", "RGB", "hot-swappable", "aluminum"],
    specs: { "Switch Type": "Cherry MX Blue", "Layout": "Full-size (104 keys)", "Connection": "USB-C detachable", "Keycap Material": "Double-shot PBT", "Polling Rate": "1000Hz", "Weight": "1.2kg" },
    images: [], reviews: [], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    name: "Apex Wireless Gaming Mouse",
    description: "Ultra-light wireless mouse with 16000 DPI optical sensor and 80hr battery life.",
    longDescription: "Weighing only 58g, the Apex Wireless features Razer's Focus Pro 30K optical sensor, mechanical optical switches rated for 100M clicks, and comes with a USB-C charging dock. The honeycomb shell design maximizes airflow without sacrificing durability.",
    price: 129.99, category: "Mice", brand: "Razer", stock: 40,
    rating: 4.7, tags: ["wireless", "ultra-light", "optical", "RGB"],
    specs: { "Sensor": "Focus Pro 30K", "DPI": "16000", "Weight": "58g", "Battery Life": "80 hours", "Connection": "2.4GHz / Bluetooth 5.0", "Switches": "Optical (100M clicks)" },
    images: [], reviews: [], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    name: "Quantum 7.1 Surround Headset",
    description: "Premium wireless headset with 7.1 surround sound, AI noise-cancelling mic, and 40hr battery.",
    longDescription: "The Quantum 7.1 delivers immersive gaming audio through custom 50mm neodymium drivers with DTS Headphone:X v2.0 surround sound. The retractable AI-powered microphone filters out background noise, while memory foam ear cushions with cooling gel ensure comfort during marathon sessions.",
    price: 159.99, category: "Headsets", brand: "SteelSeries", stock: 30,
    rating: 4.9, tags: ["wireless", "surround-sound", "noise-cancelling", "premium"],
    specs: { "Driver Size": "50mm Neodymium", "Frequency Response": "20-22,000Hz", "Battery Life": "40 hours", "Connection": "2.4GHz wireless + 3.5mm", "Microphone": "AI noise-cancelling", "Weight": "350g" },
    images: [], reviews: [], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    name: "Fusion Elite Controller",
    description: "Pro-grade wireless controller with back paddles, hair trigger locks, and swappable thumbsticks.",
    longDescription: "The Fusion Elite brings console-quality build to PC gaming. Four rear paddles, three-way hair trigger locks, and a set of interchangeable thumbsticks and D-pads give you total control. The textured rubber grip ensures no slip during intense sessions.",
    price: 89.99, category: "Controllers", brand: "PowerA", stock: 50,
    rating: 4.6, tags: ["wireless", "pro-controller", "paddles", "PC"],
    specs: { "Connection": "Wireless + USB-C", "Battery Life": "30 hours", "Paddles": "4 rear programmable", "Trigger Locks": "3-way hair trigger", "Platform": "PC / Xbox", "Weight": "280g" },
    images: [], reviews: [], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    name: "Titan XL RGB Mousepad",
    description: "Extra-large desk mat with full-surface RGB lighting, waterproof coating, and stitched edges.",
    longDescription: "Cover your entire desk with the Titan XL. At 900x400mm, this mousepad provides ample space for both keyboard and mouse. The micro-textured cloth surface offers the perfect balance of speed and control. Full perimeter RGB lighting with 16.8M colors syncs with your setup.",
    price: 49.99, category: "Mousepads", brand: "Logitech", stock: 60,
    rating: 4.5, tags: ["XL", "RGB", "waterproof", "desk-mat"],
    specs: { "Dimensions": "900x400x4mm", "Surface": "Micro-textured cloth", "Base": "Natural rubber non-slip", "Stitching": "Reinforced stitched edges", "Lighting": "Perimeter RGB 16.8M colors", "Waterproof": "Yes" },
    images: [], reviews: [], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    name: "Titan Pro Gaming Chair",
    description: "Ergonomic gaming chair with 4D armrests, lumbar support, and breathable mesh back.",
    longDescription: "The Titan Pro combines premium build quality with all-day comfort. The adjustable lumbar support and 4D armrests let you dial in the perfect position. The breathable mesh back keeps you cool during marathon sessions, while the cold-cure foam seat provides consistent support.",
    price: 449.99, category: "Chairs", brand: "Secretlab", stock: 10,
    rating: 4.9, tags: ["ergonomic", "premium", "mesh", "lumbar"],
    specs: { "Material": "Cold-cure foam + mesh back", "Armrests": "4D adjustable", "Weight Capacity": "180kg", "Recline": "85° - 165°", "Height Range": "160-200cm", "Warranty": "5 years" },
    images: [], reviews: [], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    name: "Predator 27\" 240Hz Gaming Monitor",
    description: "27-inch QHD IPS monitor with 240Hz refresh rate, 1ms response, and G-Sync compatibility.",
    longDescription: "The Predator delivers buttery-smooth gameplay with its 240Hz refresh rate and 1ms GTG response time. The QHD 2560x1440 IPS panel offers vibrant colors and wide viewing angles. With G-Sync compatibility and HDR400 support, every game looks and feels incredible.",
    price: 599.99, category: "Monitors", brand: "Acer", stock: 8,
    rating: 4.7, tags: ["240Hz", "QHD", "IPS", "G-Sync"],
    specs: { "Size": "27 inches", "Resolution": "2560x1440 (QHD)", "Refresh Rate": "240Hz", "Response Time": "1ms GTG", "Panel Type": "IPS", "HDR": "DisplayHDR 400" },
    images: [], reviews: [], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    name: "Nebula 2.1 Gaming Speakers",
    description: "Powerful 2.1 speaker system with 80W output, RGB lighting, and Bluetooth 5.2.",
    longDescription: "The Nebula 2.1 system delivers room-filling 80W sound with deep bass from the 6.5-inch subwoofer. The satellite speakers feature custom 3-inch drivers for clear mids and highs. Dynamic RGB lighting syncs with your game audio for an immersive experience.",
    price: 179.99, category: "Speakers", brand: "HyperX", stock: 20,
    rating: 4.4, tags: ["2.1", "RGB", "Bluetooth", "powerful"],
    specs: { "Total Power": "80W RMS", "Subwoofer": "6.5-inch down-firing", "Satellite Drivers": "3-inch full-range", "Connection": "Bluetooth 5.2 / 3.5mm / USB", "Frequency Response": "35-20,000Hz", "Lighting": "Dynamic RGB" },
    images: [], reviews: [], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    name: "StreamCam Pro 4K",
    description: "4K webcam with auto-focus, dual microphones, and customizable FOV for professional streaming.",
    longDescription: "The StreamCam Pro captures stunning 4K video at 30fps or 1080p at 60fps. The Sony Starvis IMX415 sensor delivers exceptional low-light performance. Dual omnidirectional microphones pick up clear audio, and the adjustable FOV (65°/78°/90°) lets you frame your shot perfectly.",
    price: 199.99, category: "Webcams", brand: "Logitech", stock: 15,
    rating: 4.6, tags: ["4K", "auto-focus", "streaming", "USB-C"],
    specs: { "Resolution": "4K @ 30fps / 1080p @ 60fps", "Sensor": "Sony Starvis IMX415", "FOV": "65°/78°/90° adjustable", "Microphone": "Dual omnidirectional", "Connection": "USB-C", "Mount": "Tripod-ready clip" },
    images: [], reviews: [], createdAt: new Date(), updatedAt: new Date(),
  },
  {
    name: "Duo Capture Card 4K60",
    description: "External capture card supporting 4K60 HDR passthrough and 1080p240 capture for streaming.",
    longDescription: "The Duo Capture Card lets you stream and record in stunning quality. With 4K60 HDR passthrough and 1080p240 capture, you never have to compromise. The ultra-low latency design ensures your gameplay feels responsive, while dual USB-C ports provide flexible connectivity.",
    price: 159.99, category: "Capture Cards", brand: "Elgato", stock: 12,
    rating: 4.5, tags: ["4K60", "HDR", "low-latency", "streaming"],
    specs: { "Passthrough": "4K60 HDR", "Capture": "1080p240 / 1440p60 / 4K30", "Latency": "Ultra-low (<1ms)", "Connection": "USB-C 3.2 Gen 2", "HDR": "HDR10 passthrough", "Compatibility": "PC / PS5 / Xbox Series X" },
    images: [], reviews: [], createdAt: new Date(), updatedAt: new Date(),
  },
];

await db.collection("products").insertMany(products);
console.log(`Inserted ${products.length} products`);
await client.close();
