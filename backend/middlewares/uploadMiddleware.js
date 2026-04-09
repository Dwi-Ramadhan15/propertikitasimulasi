const multer = require('multer');

// Simpan file di memori sementara (RAM) karena akan langsung kita lempar ke MinIO
const storage = multer.memoryStorage();

// Filter hanya izinkan gambar
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Hanya file gambar yang diperbolehkan!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Batas ukuran 5MB per gambar
});

// Middleware untuk menerima multiple upload (maksimal 10 gambar sekaligus)
exports.uploadMultiple = upload.array('images', 10);