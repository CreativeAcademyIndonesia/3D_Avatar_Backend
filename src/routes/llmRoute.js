const express = require('express')
const router = express.Router()
const { chatAvatar } = require('../controllers/llmController')
const { analisaAgen } = require('../controllers/analisaAgen')
const { getHistoryChat, getHistoryDetails, deleteHistoryChat } = require('../controllers/getHistoryChat')
const { accessValidation, login } = require('../controllers/auth/auth')

router.post('/', accessValidation, chatAvatar)
router.post('/analisa', analisaAgen)
router.get('/history', getHistoryChat)
router.get('/history-details', getHistoryDetails)
router.delete('/history', deleteHistoryChat)
router.post("/login", login);

module.exports = router