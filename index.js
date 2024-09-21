require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT // Tambahkan nilai default jika PORT tidak terbaca
const llmRoute = require('./src/routes/llmRoute')
const cors = require('cors') // Tambahkan middleware CORS

app.use(express.json())
app.use(cors()) 

app.use('/avatar/chat', llmRoute)

app.use('/', (req, res)=>{
  res.send('it works')
})
app.listen(port, () => {
  console.log(`Aplikasi berjalan di http://localhost:${port}`)
})