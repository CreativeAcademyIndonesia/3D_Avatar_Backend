const { get, getDetailsChat, deleted } = require("../models/db_aiModel")

// localhost:5000/avatar/chat/history?month=9
const getHistoryChat = async(req, res)=>{
    let { month } = req.query
    try{
        month = month || new Date().getMonth() + 1;
        const data = await get(month)
        res.status(200).json({
            data, 
            message : `Berikut merupakan data chat history yang telah di group by nama.`
        })
    }catch(err){
        console.log(err)
        res.status(500).json({
            data : [], 
            message : `Terjadi kesalahan : ${err.message}`
        })
    }
}

// localhost:5000/avatar/chat/history-details?session=1
const getHistoryDetails = async(req, res)=>{
    let { session } = req.query
    try{
        const data = await getDetailsChat(session)
        res.status(200).json({
            data, 
            message : `Berikut merupakan data chat history.`
        })
    }catch(err){
        console.log(err)
        res.status(500).json({
            data : [], 
            message : `Terjadi kesalahan : ${err.message}`
        })
    }
}

// localhost:5000/avatar/chat/history   
const deleteHistoryChat = async(req, res)=>{
    let { session } = req.body
    try{
        const data = await deleted(session)
        res.status(200).json({
            data, 
            message : `data berhasil dihapus.`
        })
    }catch(err){
        console.log(err)
        res.status(500).json({
            data : [], 
            message : `Terjadi kesalahan : ${err.message}`
        })
    }
}

module.exports = {
    getHistoryChat,
    getHistoryDetails, 
    deleteHistoryChat
}