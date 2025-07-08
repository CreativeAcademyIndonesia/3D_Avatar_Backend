const express = require('express')
const router = express.Router()
const { chatAvatar } = require('../controllers/llmController')
const { analisaAgen } = require('../controllers/analisaAgen')
const { getHistoryChat, getHistoryDetails, deleteHistoryChat } = require('../controllers/getHistoryChat')
const { accessValidation, login, registers, updateUsers, updateDataUsers, getAllUsersController } = require('../controllers/auth/auth')
const { getDashboardData, getDashboardDetailData } = require('../controllers/dashboardController')

router.post('/', accessValidation, chatAvatar)
router.post('/analisa', analisaAgen)
router.get('/history', getHistoryChat)
router.get('/history-details', getHistoryDetails)
router.delete('/history', deleteHistoryChat)
router.post("/login", login);
router.post("/register", registers);
router.put("/update-users", accessValidation, updateUsers);
router.put("/update-data-user", accessValidation, updateDataUsers);
router.get("/get-all-user", accessValidation, getAllUsersController);
router.get("/dashboard", accessValidation, getDashboardData);
router.get("/dashboard/detail", accessValidation, getDashboardDetailData);

module.exports = router