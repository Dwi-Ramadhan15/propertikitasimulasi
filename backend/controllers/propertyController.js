const db = require('../models/db');
const minioClient = require('../minioClient');
require('dotenv').config();

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'propertikita-cba';

const createSlug = (title, id) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + id;
};

exports.createProperty = async(req, res) => {
    const { title, description, address, price, bedrooms, bathrooms, area_sqm, latitude, longitude, facilities } = req.body;
    const agent_id = req.user.id;

    try {
        if (!req.files || req.files.length < 2) {
            return res.status(400).json({ error: "Minimal harus mengunggah 2 foto properti!" });
        }

        const newProperty = await db.query(
            `INSERT INTO properties (title, description, address, price, bedrooms, bathrooms, area_sqm, latitude, longitude, agent_id, status, facilities) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11) RETURNING id`, [title, description, address, price, bedrooms, bathrooms, area_sqm, latitude, longitude, agent_id, facilities]
        );

        const propertyId = newProperty.rows[0].id;
        const slug = createSlug(title, propertyId);

        await db.query(`UPDATE properties SET slug = $1 WHERE id = $2`, [slug, propertyId]);

        for (const file of req.files) {
            const fileName = `property-${propertyId}-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

            await minioClient.putObject(BUCKET_NAME, fileName, file.buffer, file.size, {
                'Content-Type': file.mimetype
            });

            const imageUrl = `http://${process.env.MINIO_ENDPOINT || '127.0.0.1'}:${process.env.MINIO_PORT || 9000}/${BUCKET_NAME}/${fileName}`;

            await db.query(
                `INSERT INTO property_images (property_id, image_url) VALUES ($1, $2)`, [propertyId, imageUrl]
            );
        }

        res.status(201).json({ message: "Properti berhasil ditambahkan dan sedang menunggu persetujuan Admin!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal menambahkan properti" });
    }
};

exports.getPropertyBySlug = async(req, res) => {
    const { slug } = req.params;
    try {
        const property = await db.query(`
            SELECT p.*, u.name as agent_name, u.phone_number as agent_phone,
                   ARRAY(SELECT image_url FROM property_images pi WHERE pi.property_id = p.id) as images
            FROM properties p
            JOIN users u ON p.agent_id = u.id
            WHERE p.slug = $1 AND p.status = 'approved'
        `, [slug]);

        if (property.rows.length === 0) return res.status(404).json({ error: "Properti tidak ditemukan" });
        res.json(property.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal mengambil detail properti" });
    }
};

exports.getPublicProperties = async(req, res) => {
    const { search, priceRange, bedrooms } = req.query;

    let query = `
        SELECT p.*, u.name as agent_name, 
                ARRAY(SELECT image_url FROM property_images pi WHERE pi.property_id = p.id) as images
        FROM properties p
        JOIN users u ON p.agent_id = u.id
        WHERE p.status = 'approved'
    `;
    const values = [];
    let valueIndex = 1;

    if (search) {
        query += ` AND (p.title ILIKE $${valueIndex} OR p.description ILIKE $${valueIndex} OR p.address ILIKE $${valueIndex})`;
        values.push(`%${search}%`);
        valueIndex++;
    }

    if (priceRange) {
        if (priceRange === '< 500 Juta') query += ` AND p.price < 500000000`;
        else if (priceRange === '500 Jt - 1 M') query += ` AND p.price BETWEEN 500000000 AND 1000000000`;
        else if (priceRange === '> 1 Milyar') query += ` AND p.price > 1000000000`;
    }

    if (bedrooms) {
        const bedNum = parseInt(bedrooms.charAt(0));
        if (!isNaN(bedNum)) {
            query += ` AND p.bedrooms >= ${bedNum}`;
        }
    }

    query += ` ORDER BY p.created_at DESC`;

    try {
        const properties = await db.query(query, values);
        res.json(properties.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal mengambil data properti publik" });
    }
};

exports.getAgentProperties = async(req, res) => {
    const agent_id = req.user.id;
    try {
        const properties = await db.query(`
            SELECT p.*, 
                   ARRAY(SELECT image_url FROM property_images pi WHERE pi.property_id = p.id) as images
            FROM properties p 
            WHERE p.agent_id = $1 
            ORDER BY p.created_at DESC
        `, [agent_id]);
        res.json(properties.rows);
    } catch (err) {
        res.status(500).json({ error: "Gagal mengambil data properti agen" });
    }
};

exports.getAllPropertiesAdmin = async(req, res) => {
    try {
        const properties = await db.query(`
            SELECT p.*, u.name as agent_name, 
                   ARRAY(SELECT image_url FROM property_images pi WHERE pi.property_id = p.id) as images
            FROM properties p
            JOIN users u ON p.agent_id = u.id
            ORDER BY 
                CASE WHEN p.status = 'pending' THEN 1 ELSE 2 END,
                p.created_at DESC
        `);
        res.json(properties.rows);
    } catch (err) {
        res.status(500).json({ error: "Gagal mengambil data properti admin" });
    }
};

exports.updatePropertyStatus = async(req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await db.query('UPDATE properties SET status = $1 WHERE id = $2', [status, id]);
        res.json({ message: `Properti berhasil di-${status}!` });
    } catch (err) {
        res.status(500).json({ error: "Gagal mengubah status" });
    }
};

exports.getPropertyById = async(req, res) => {
    const { id } = req.params;
    try {
        const property = await db.query(`
            SELECT p.*, u.name as agent_name, u.phone_number as agent_phone,
                   ARRAY(SELECT image_url FROM property_images pi WHERE pi.property_id = p.id) as images
            FROM properties p
            JOIN users u ON p.agent_id = u.id
            WHERE p.id = $1 AND p.status = 'approved'
        `, [id]);

        if (property.rows.length === 0) return res.status(404).json({ error: "Properti tidak ditemukan" });
        res.json(property.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal mengambil detail" });
    }
};