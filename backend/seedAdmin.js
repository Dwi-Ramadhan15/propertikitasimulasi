const argon2 = require('argon2');
const db = require('./models/db');
require('dotenv').config();

async function createAdmin() {
    try {
        const hashedPassword = await argon2.hash('admin1234');
        await db.query(
            `INSERT INTO users (name, email, password, role, phone_number, is_verified) 
             VALUES ($1, $2, $3, $4, $5, $6)`, ['Super Admin', 'adminpropertikita@gmail.com', hashedPassword, 'super_admin', '083119809352', true]
        );
        console.log('✅ Akun Admin berhasil di-inject ke Database!');
        process.exit();
    } catch (err) {
        console.error('❌ Gagal inject Admin:', err);
        process.exit(1);
    }
}
createAdmin();