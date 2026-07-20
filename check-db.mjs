import "dotenv/config"
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "";
const client = new MongoClient(uri);
await client.connect();

// sessions that exist in each DB by searching for the token from login
const testToken = "BDUbylcugB6eYDYYJ7iPDhaWT7atbEgX";
const allDbs = await client.db().admin().listDatabases();
for (const dbInfo of allDbs.databases) {
  const db = client.db(dbInfo.name);
  try {
    const s = await db.collection("session").findOne({ token: testToken });
    if (s) console.log(`Token found in DB "${dbInfo.name}":`, s.userId);
  } catch {}
}

await client.close();
