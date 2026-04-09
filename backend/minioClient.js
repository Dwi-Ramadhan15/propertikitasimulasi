const Minio = require('minio');
require('dotenv').config();

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
    port: parseInt(process.env.MINIO_PORT) || 9000,
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
});

const bucketName = process.env.MINIO_BUCKET_NAME || 'propertikita-cba';

const publicPolicy = {
    Version: '2012-10-17',
    Statement: [{
        Sid: 'PublicRead',
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucketName}/*`]
    }]
};

async function initMinio() {
    try {
        const exists = await minioClient.bucketExists(bucketName);
        if (exists) {
            console.log(`✅ Bucket ${bucketName} already exists.`);
        } else {
            await minioClient.makeBucket(bucketName, 'us-east-1');
            console.log(`✅ Bucket ${bucketName} created successfully.`);
        }

        await minioClient.setBucketPolicy(bucketName, JSON.stringify(publicPolicy));
        console.log(`🔓 Akses Bucket ${bucketName} berhasil dibuka menjadi PUBLIC!`);

    } catch (err) {
        console.error("❌ Gagal inisialisasi MinIO:", err);
    }
}

initMinio();

module.exports = minioClient;