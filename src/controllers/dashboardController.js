const { getDashboardOverview, getDashboardDetail } = require("../models/db_aiModel")

const getDashboardData = async(req, res)=>{
    try{
        const data = await getDashboardOverview()
        res.status(200).json({
            data, 
            message : `Berikut merupakan data overview dashboard.`
        })
    }catch(err){
        console.log(err)
        res.status(500).json({
            data : [], 
            message : `Terjadi kesalahan : ${err.message}`
        })
    }
}

const getDashboardDetailData = async(req, res)=>{
    const { nama } = req.query
    try{
        const data = await getDashboardDetail(nama)
        res.status(200).json({
            data, 
            message : `Berikut merupakan detail chat history untuk ${nama}.`
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
    getDashboardData,
    getDashboardDetailData
} 