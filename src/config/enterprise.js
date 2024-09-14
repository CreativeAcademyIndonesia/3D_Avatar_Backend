// Get the client
const mysql = require('mysql2/promise');

const connection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_ENTERPRISE,
  password : process.env.DB_PASSWORD
});

module.exports = connection