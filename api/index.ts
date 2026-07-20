import { app, start } from "../src/index"

let ready = false

export default async function handler(req: any, res: any) {
  if (!ready) {
    await start()
    ready = true
  }
  return app(req, res)
}
