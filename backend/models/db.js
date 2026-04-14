const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 5432,
});
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error saat koneksi ke PostgreSQL:', err.stack);
    }
    console.log('✅ Koneksi ke Database PostgreSQL Berhasil!');
    release();
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};