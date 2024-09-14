const dbEnterprise = require('../config/enterprise')

const get = async ()=>{
    try{
        const sql = 'SELECT * FROM menu_makan'
        const [result, action] = await dbEnterprise.query(sql)
        return result
    }catch(err){
        console.log(err)
        throw err
    }
}

const insert = async (body)=>{
    try{
        const {menu, harga} = body
        const sql = 'INSERT INTO menu_makan (menu, harga) VALUES (?, ?)'
        const data = await dbEnterprise.query(sql, [menu, harga])
        return data
    }catch(err){
        console.log(err)
        throw err
    }
}

const update = async (body, id)=>{
    try{
        const {menu, harga} = body
        const sql = 'UPDATE menu_makan SET menu = ?, harga = ? WHERE id = ?'
        const [data] = await dbEnterprise.query(sql, [menu, harga, id])
        return data
    }catch(err){
        throw err
    }
}

const deleted = async (id)=>{
    try{
        const sql = 'DELETE FROM menu_makan WHERE id = ?'
        const [data] = await dbEnterprise.query(sql, [id])
        return data
    }catch(err){
        console.log(err)
        throw err
    }
}

const insertPesanan = async (body)=>{
    try{
        const {menu, qty, catatan} = body
        const sql = 'INSERT INTO pesanan (menu, qty, catatan) VALUES (?, ?, ?)'
        const data = await dbEnterprise.query(sql, [menu, qty, catatan])
        return data
    }catch(err){
        console.log(err)
        throw err
    }
}
module.exports = {get, insert, update, deleted, insertPesanan}