const mysql = require("mysql2/promise");
require("dotenv").config();
 
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});
 
// Quick startup check so a bad .env fails loudly instead of
// silently breaking every route later.
pool
    .getConnection()
    .then((connection) => {
        console.log("MySQL connected successfully");
        connection.release();
    })
    .catch((err) => {
        console.error("MySQL connection failed:", err.message);
    });
 
module.exports = pool;