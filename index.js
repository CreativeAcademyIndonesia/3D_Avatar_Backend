require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT // Tambahkan nilai default jika PORT tidak terbaca
const llmRoute = require('./src/routes/llmRoute')
app.use(express.json())

app.use('/chat', llmRoute)

app.listen(port, () => {
  console.log(`Aplikasi berjalan di http://localhost:${port}`)
})