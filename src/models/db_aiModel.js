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

const getUser = async (username) => {
    try {
        const sql = `
            SELECT * FROM users WHERE username = ?
        `;
        const [result, action] = await db_ai.query(sql, [username]);
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

const createUser = async (username, password) => {
    try {
        // Cek apakah username sudah ada
        const checkUserSql = `
            SELECT * FROM users WHERE username = ?
        `;
        const [existingUser] = await db_ai.query(checkUserSql, [username]);

        // Jika username sudah ada, return pesan bahwa user sudah ada
        if (existingUser.length > 0) {
            return { pesan: 'Username already exists', success: false };
        }

        // Jika username belum ada, buat user baru dengan role default 'user'
        const createUserSql = `
            INSERT INTO users (username, password, role) VALUES (?, ?, 'user')
        `;
        const [insertResult] = await db_ai.query(createUserSql, [username, password]);

        // Return hasil dari proses insert
        return { pesan: 'User created successfully', success: true, insertId: insertResult.insertId };
    } catch (err) {
        console.error('Error creating user:', err);
        // Menangani kemungkinan error database dan memberikan pesan error yang lebih deskriptif
        return { pesan: 'Error creating user', success: false, error: err };
    }
};

const updatePassword = async(nama, password)=>{
    console.log(nama)
    try {
        // Update password pengguna berdasarkan username
        const updateUserSql = `
            UPDATE users SET password = ? WHERE username = ?
        `;
        const [updateResult] = await db_ai.query(updateUserSql, [password, nama]);

        // Jika tidak ada baris yang terpengaruh, berarti username tidak ditemukan
        if (updateResult.affectedRows === 0) {
            return { pesan: 'User not found', success: false };
        }

        // Return hasil dari proses update
        return { pesan: 'User updated successfully', success: true };
    } catch (err) {
        console.error('Error updating user:', err);
        // Menangani kemungkinan error database dan memberikan pesan error yang lebih deskriptif
        return { pesan: 'Error updating user', success: false, error: err };
    }
}

const updateDataUser = async (username, newData) => {
    try {
        // Buat array untuk menyimpan field dan value yang akan diupdate
        const updateFields = [];
        const values = [];
        
        // Cek setiap field yang ada di newData
        if (newData.username) {
            updateFields.push('username = ?');
            values.push(newData.username);
        }
        if (newData.role) {
            updateFields.push('role = ?');
            values.push(newData.role);
        }
        
        // Jika tidak ada field yang diupdate
        if (updateFields.length === 0) {
            return { pesan: 'No data to update', success: false };
        }
        
        // Tambahkan username original ke values array untuk WHERE clause
        values.push(username);
        
        const updateUserSql = `
            UPDATE users 
            SET ${updateFields.join(', ')} 
            WHERE username = ?
        `;
        console.log(updateUserSql)
        const [updateResult] = await db_ai.query(updateUserSql, values);

        if (updateResult.affectedRows === 0) {
            return { pesan: 'User not found', success: false };
        }

        return { pesan: 'User data updated successfully', success: true };
    } catch (err) {
        console.error('Error updating user data:', err);
        return { pesan: 'Error updating user data', success: false, error: err };
    }
}

const getDashboardOverview = async () => {
    try {
        const sql = `
            SELECT 
                nama,
                COUNT(*) as total_chat,
                MAX(created_at) as last_chat,
                MIN(created_at) as first_chat
            FROM history_chat 
            GROUP BY nama
        `;
        const [result] = await db_ai.query(sql);
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

const getDashboardDetail = async (nama) => {
    try {
        const sql = `SELECT * FROM history_chat WHERE nama = ?`;
        const [result] = await db_ai.query(sql, [nama]);
        return result;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

const getAllUsers = async () => {
    try {
        const sql = `
            SELECT id, username, role 
            FROM users 
            ORDER BY username ASC
        `;
        const [result] = await db_ai.query(sql);
        return { success: true, data: result };
    } catch (err) {
        console.error('Error getting all users:', err);
        return { success: false, error: err };
    }
}

module.exports = {
    get, 
    getDetailsChat, 
    insert, 
    deleted, 
    saveAnalisa, 
    createUser, 
    getUser,
    getAllUsers, 
    updatePassword, 
    updateDataUser,
    getDashboardOverview, 
    getDashboardDetail
}