import "dotenv/config"
import { app, init } from "../api/index.js"

const PORT = process.env.PORT || 4000

init()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch(console.error)
