const express = require('express')
const router = express.Router()
const {
    chatAvatar
} = require('../controllers/llmController')

router.get('/', chatAvatar)

module.exports = router