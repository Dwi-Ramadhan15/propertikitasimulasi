const db = require('../models/db');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const fonnte = require('../utils/fonnte');
const emailUtil = require('../utils/email');
require('dotenv').config();

exports.registerUser = async(req, res) => {
    const { name, email, password, phone_number } = req.body;
    try {
        const userExist = await db.query('SELECT * FROM users WHERE email = $1 OR phone_number = $2', [email, phone_number]);
        if (userExist.rows.length > 0) return res.status(400).json({ error: "Email atau Nomor WA sudah terdaftar!" });

        const hashedPassword = await argon2.hash(password);
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        const newUser = await db.query(
            `INSERT INTO users (name, email, password, role, phone_number, is_verified, otp_code) 
             VALUES ($1, $2, $3, 'user', $4, false, $5) RETURNING id, name, email, phone_number`, [name, email, hashedPassword, phone_number, otpCode]
        );

        await fonnte.sendWhatsAppOTP(phone_number, otpCode);

        res.status(201).json({
            message: "Registrasi berhasil! Silakan cek WhatsApp Anda untuk kode OTP.",
            phone_number: newUser.rows[0].phone_number
        });
    } catch (err) {
        res.status(500).json({ error: "Gagal registrasi user" });
    }
};

exports.registerAgen = async(req, res) => {
    const { name, email, password, phone_number } = req.body;
    try {
        const userExist = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExist.rows.length > 0) return res.status(400).json({ error: "Email sudah terdaftar!" });

        const hashedPassword = await argon2.hash(password);
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        const newUser = await db.query(
            `INSERT INTO users (name, email, password, role, phone_number, is_verified, otp_code) 
             VALUES ($1, $2, $3, 'agen', $4, false, $5) RETURNING id, name, email`, [name, email, hashedPassword, phone_number, otpCode]
        );

        await emailUtil.sendEmailOTP(email, otpCode);

        res.status(201).json({ message: "Registrasi Agen berhasil! Silakan cek Email Anda untuk kode OTP." });
    } catch (err) {
        res.status(500).json({ error: "Gagal registrasi agen" });
    }
};

exports.verifyOtp = async(req, res) => {
    const { identifier, otp_code } = req.body;
    try {
        const user = await db.query('SELECT * FROM users WHERE phone_number = $1 OR email = $1', [identifier]);

        if (user.rows.length === 0) return res.status(404).json({ error: "Data pengguna tidak ditemukan!" });
        if (user.rows[0].is_verified) return res.status(400).json({ error: "Akun sudah diverifikasi sebelumnya!" });
        if (user.rows[0].otp_code !== otp_code) return res.status(400).json({ error: "Kode OTP salah!" });

        await db.query(
            'UPDATE users SET is_verified = true, otp_code = NULL WHERE id = $1', [user.rows[0].id]
        );

        res.json({ message: "Verifikasi berhasil! Akun Anda sudah aktif, silakan login." });
    } catch (err) {
        res.status(500).json({ error: "Gagal verifikasi OTP" });
    }
};

exports.login = async(req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) return res.status(404).json({ error: "Email tidak ditemukan!" });

        const validPassword = await argon2.verify(user.rows[0].password, password);
        if (!validPassword) return res.status(400).json({ error: "Password salah!" });

        if (!user.rows[0].is_verified && user.rows[0].role !== 'super_admin') {
            return res.status(403).json({ error: "Akun belum diverifikasi! Silakan cek WA/Email Anda." });
        }

        const token = jwt.sign({ id: user.rows[0].id, role: user.rows[0].role },
            process.env.JWT_SECRET || 'rahasia_negara_123', { expiresIn: '24h' }
        );

        res.json({
            message: "Login berhasil!",
            token: token,
            user: {
                id: user.rows[0].id,
                name: user.rows[0].name,
                email: user.rows[0].email,
                role: user.rows[0].role,
                phone_number: user.rows[0].phone_number
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Gagal login" });
    }
};