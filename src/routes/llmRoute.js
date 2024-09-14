const express = require('express')
const router = express.Router()
const {
    chatAvatar
} = require('../controllers/llmController')

router.post('/', chatAvatar)

module.exports = router