const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./models/db');
require('./minioClient'); // Pastikan file ini ada

const app = express();

// 1. MIDDLEWARE WAJIB DI ATAS (Biar backend bisa baca kiriman data dari React)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. ROUTES (Baru panggil jalurnya di bawah middleware)
const propertyRoutes = require('./routes/propertyRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);

// 3. ROUTE DASAR
app.get('/', (req, res) => {
    res.json({ message: "🚀 Selamat datang di API PropertiKita!" });
});

app.get('/api/test-db', async(req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.json({
            message: "Database Terkoneksi dan bisa di-query!",
            waktu_server: result.rows[0].now
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal query ke database" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`🚀 Server PropertiKita berjalan di Port ${PORT}`);
    // Saya ubah URL-nya biar ngarah ke test API biasa, bukan ke Swagger yang belum ada
    console.log(`🔗 URL: http://localhost:${PORT}/`);
    console.log(`=========================================\n`);
});