import express from 'express';
import { upload } from '../config/cloudinary.js';
import verifyToken from '../middleware/authMiddleware.js';
import pool from '../db.js';

const router = express.Router();

router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided.' });
    }

    const { subject, year } = req.body;
    const fileUrl = req.file.path;
    const fileName = req.file.originalname;
    const uploaderId = req.user.userId;

    const placeholderText = "Text extraction coming in Day 6";

    const newPyq = await pool.query(
      `INSERT INTO pyqs (uploader_id, file_name, file_url, text_content, subject, year) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [uploaderId, fileName, fileUrl, placeholderText, subject, year || null]
    );

    res.status(201).json({
      message: 'File successfully uploaded to Cloudinary and saved to database!',
      pyq: newPyq.rows[0]
    });

  } catch (error) {
    console.error('Upload Error:', error.message);
    res.status(500).json({ error: 'Server error during upload' });
  }
});

export default router;