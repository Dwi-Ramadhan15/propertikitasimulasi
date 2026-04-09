const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendEmailOTP = async(targetEmail, otpCode) => {
    try {
        const mailOptions = {
            from: `"PropertiKita Admin" <${process.env.EMAIL_USER}>`,
            to: targetEmail,
            subject: 'Kode OTP Registrasi Agen PropertiKita',
            html: `
                <div style="font-family: Arial, sans-serif; max-w-md; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2 style="color: #2563EB;">Selamat Datang di PropertiKita! 🏡</h2>
                    <p>Halo Agen,</p>
                    <p>Kode OTP registrasi Anda adalah:</p>
                    <h1 style="font-size: 32px; letter-spacing: 5px; color: #333;">${otpCode}</h1>
                    <p style="color: red; font-size: 12px;">*Jangan berikan kode ini kepada siapapun.</p>
                </div>
            `
        };
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Nodemailer sukses kirim ke:", targetEmail);
        return info;
    } catch (error) {
        console.error("❌ Gagal mengirim Email OTP:", error);
        throw error;
    }
};