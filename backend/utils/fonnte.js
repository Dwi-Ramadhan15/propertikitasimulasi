require('dotenv').config();

exports.sendWhatsAppOTP = async(targetNumber, otpCode) => {
    try {
        const message = `Halo dari PropertiKita! 🏡\n\nKode OTP registrasi Anda adalah: *${otpCode}*\n\nJangan berikan kode ini kepada siapapun.`;

        const response = await fetch("https://api.fonnte.com/send", {
            method: "POST",
            headers: {
                "Authorization": process.env.FONNTE_TOKEN
            },
            body: new URLSearchParams({
                target: targetNumber,
                message: message,
                countryCode: "62" // Memastikan format nomor Indo (08 diganti ke 628 otomatis)
            })
        });

        const data = await response.json();
        console.log("Status Fonnte:", data);
        return data;
    } catch (error) {
        console.error("Gagal mengirim WA via Fonnte:", error);
        throw error;
    }
};