const express = require('express')
const router = express.Router()
const { chatAvatar } = require('../controllers/llmController')
const { analisaAgen } = require('../controllers/analisaAgen')
const { getHistoryChat, getHistoryDetails, deleteHistoryChat } = require('../controllers/getHistoryChat')

router.post('/', chatAvatar)
router.post('/analisa', analisaAgen)
router.get('/history', getHistoryChat)
router.get('/history-details', getHistoryDetails)
router.delete('/history', deleteHistoryChat)

module.exports = router