const jwt = require('jsonwebtoken');
require('dotenv').config();

// 1. Cek apakah user sudah login (punya token)
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

    if (!token) return res.status(401).json({ error: "Akses ditolak, Token tidak ada!" });

    jwt.verify(token, process.env.JWT_SECRET || 'rahasia_negara_123', (err, user) => {
        if (err) return res.status(403).json({ error: "Token tidak valid atau sudah kadaluarsa!" });

        req.user = user; // Simpan data user (id & role) ke request
        next();
    });
};

// 2. Cek Role (Bisa banyak role sekaligus, cth: ['admin', 'agen'])
exports.checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Akses ditolak! Anda tidak memiliki izin." });
        }
        next();
    };
};