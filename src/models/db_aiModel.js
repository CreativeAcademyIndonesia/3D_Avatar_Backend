const db_ai = require('../config/db_ai')

const get = async (month) => {
    try {
        const sql = `
            SELECT h.id, h.nama, h.session, a.ai_sensitivity, a.ai_spesificity, a.ai_ppv, a.ai_auc, 
                   a.uc_sensitivity, a.uc_spesificity, a.uc_ppv, a.uc_auc, a.score
            FROM history_chat h
            LEFT JOIN analytics_result a ON h.session = a.session
            WHERE MONTH(h.created_at) = ?
            GROUP BY h.session
        `;
        const [result, action] = await db_ai.query(sql, [month]);
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

const getDetailsChat = async (session)=>{
    try{
        const sql = `SELECT * FROM history_chat WHERE session = ?`;
        const [result, action] = await db_ai.query(sql, [session])
        return result
    }catch(err){
        console.log(err)
        throw err
    }
}

const insert = async (data)=>{
    const {nama, human_message, ai_message, session} = data
    try{
        const sql = 'INSERT INTO history_chat (nama, human_message, ai_message, session) VALUES (?, ?, ?, ?)'
        const data = await db_ai.query(sql, [nama, human_message, ai_message, session])
        return data
    }catch(err){
        console.log(err)
        throw err
    }
}

const deleted = async (session)=>{
    try{
        const sql = 'DELETE FROM history_chat WHERE session = ?'
        const [data] = await db_ai.query(sql, [session])
        return data
    }catch(err){
        console.log(err)
        throw err
    }
}

const saveAnalisa = async (data)=>{
    const {nama, session, ai_sensitivity, ai_spesificity, ai_ppv, ai_auc, uc_sensitivity, uc_spesificity, uc_ppv, uc_auc, score} = data
    try{
        const sql = 'INSERT INTO analytics_result (nama, session, ai_sensitivity, ai_spesificity, ai_ppv, ai_auc, uc_sensitivity, uc_spesificity, uc_ppv, uc_auc, score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        const data = await db_ai.query(sql, [nama, session, ai_sensitivity, ai_spesificity, ai_ppv, ai_auc, uc_sensitivity, uc_spesificity, uc_ppv, uc_auc, score])
        return data
    }catch(err){
        console.log(err)
        throw err
    }
}

module.exports = {get, getDetailsChat, insert, deleted, saveAnalisa}