const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./models/db');
require('./minioClient');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const propertyRoutes = require('./routes/propertyRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);

app.get('/', (req, res) => {
    res.json({ message: "🚀 Selamat datang di API PropertiKita!" });
});

app.get('/api/test-db', async(req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.json({
            message: "Database Terkoneksi!",
            waktu_server: result.rows[0].now
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal query ke database" });
    }
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server berjalan di Port ${PORT}`);
    });
}