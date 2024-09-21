require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT // Tambahkan nilai default jika PORT tidak terbaca
const llmRoute = require('./src/routes/llmRoute')
const cors = require('cors') // Tambahkan middleware CORS

app.use(express.json())
const corsOptions = {
  origin: 'https://avatar.creativeacade.my.id', // Ganti dengan origin yang diizinkan
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Metode yang diizinkan
  credentials: true // Jika Anda menggunakan cookie atau otentikasi
};

app.use(cors(corsOptions)); 

app.use('/avatar/chat', llmRoute)

app.use('/', (req, res)=>{
  res.send('it works')
})
app.listen(port, () => {
  console.log(`Aplikasi berjalan di http://localhost:${port}`)
})