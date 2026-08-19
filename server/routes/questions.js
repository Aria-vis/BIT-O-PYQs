import express from 'express';
import pool from '../db.js';
import verifyToken from '../middleware/authMiddleware.js';
import { splitQuestions } from '../utils/textParser.js';
import upload from '../middleware/uploadMiddleware.js';
import { preprocessImage, runOCR } from '../utils/ocrParser.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { parseFilenameWithLLM } from '../utils/llmFallback.js';
import { generateEmbedding, generateTextHash, initModel } from '../utils/embeddings.js';

initModel().catch(console.error);

const router = express.Router();

router.post('/text', verifyToken, async (req, res) => {
  const { text, subject_id, semester, year, exam_type } = req.body;
  const uploader_id = req.user.userId;

  if (!text || !subject_id) {
    return res.status(400).json({ error: 'Text and subject_id are required' });
  }

  try {
    await pool.query('BEGIN');

    let paperResult = await pool.query(
      `SELECT id FROM question_papers 
       WHERE subject_id = $1 AND semester = $2 AND year = $3 AND exam_type = $4`,
      [subject_id, semester || null, year || null, exam_type || null]
    );

    let paper_id;
    if (paperResult.rows.length > 0) {
      paper_id = paperResult.rows[0].id;
    } else {
      const newPaper = await pool.query(
        `INSERT INTO question_papers (subject_id, semester, year, exam_type)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [subject_id, semester || null, year || null, exam_type || null]
      );
      paper_id = newPaper.rows[0].id;
    }

    const questionsArray = splitQuestions(text);
    const insertedQuestions = [];

    for (const qText of questionsArray) {
      const parsedHints = req.body.hints ? (typeof req.body.hints === 'string' ? JSON.parse(req.body.hints) : req.body.hints) : {};
      
      const metadata_hints = JSON.stringify({
        inferred_from_filename: parsedHints, 
        final_confirmed_values: { semester, year, exam_type }
      });

      const textHash = generateTextHash(qText);
      let embeddingVector;

      const existingCheck = await pool.query(
        'SELECT embedding FROM questions WHERE text_hash = $1 LIMIT 1', 
        [textHash]
      );

      if (existingCheck.rows.length > 0) {
        embeddingVector = existingCheck.rows[0].embedding;
        if (typeof embeddingVector !== 'string') embeddingVector = JSON.stringify(embeddingVector);
      } else {
        const rawVector = await generateEmbedding(qText);
        embeddingVector = JSON.stringify(rawVector);
      }

      const qResult = await pool.query(
        `INSERT INTO questions (paper_id, uploader_id, raw_text, clean_text, metadata_hints, text_hash, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, clean_text`,
        [paper_id, uploader_id, qText, qText, metadata_hints, textHash, embeddingVector] 
      );
      insertedQuestions.push(qResult.rows[0]);
    }

    await pool.query('COMMIT');
    res.status(201).json({
      message: `Successfully saved ${insertedQuestions.length} question(s).`,
      questions: insertedQuestions
    });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Text Upload Error:', err);
    res.status(500).json({ error: 'Server error during question upload' });
  }
});

router.post('/image', verifyToken, (req, res) => {
  const uploadSingle = upload.single('image');

  uploadSingle(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'File size exceeds the 5MB limit.' });
      if (err.message === 'INVALID_FILE_TYPE') return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, and WEBP are allowed.' });
      return res.status(500).json({ error: `Upload error: ${err.message}` });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided.' });
    }

    try {
      const processedBuffer = await preprocessImage(req.file.buffer);
      const { text, confidence } = await runOCR(processedBuffer);

      if (!text || confidence < 40) {
        return res.status(422).json({
          error: 'OCR failed to read the image clearly. Please try a better lit or clearer photo.',
          confidence: Math.round(confidence)
        });
      }

      res.status(200).json({
        message: 'Image processed successfully.',
        extractedText: text,
        confidence: Math.round(confidence)
      });

    } catch (error) {
      console.error('Processing Pipeline Error:', error);
      res.status(500).json({ error: 'Failed to process the image.' });
    }
  });
});

router.post('/image/confirm', verifyToken, upload.single('image'), async (req, res) => {
  const { text, subject_id, semester, year, exam_type } = req.body;
  const uploader_id = req.user.userId;

  if (!text || !subject_id || !req.file) {
    return res.status(400).json({ error: 'Image, text, and subject_id are required' });
  }

  try {
    await pool.query('BEGIN');

    const processedBuffer = await preprocessImage(req.file.buffer);
    const cloudinaryResult = await uploadToCloudinary(processedBuffer);
    const image_url = cloudinaryResult.secure_url;

    let paperResult = await pool.query(
      `SELECT id FROM question_papers WHERE subject_id = $1 AND semester = $2 AND year = $3 AND exam_type = $4`,
      [subject_id, semester || null, year || null, exam_type || null]
    );

    let paper_id;
    if (paperResult.rows.length > 0) {
      paper_id = paperResult.rows[0].id;
    } else {
      const newPaper = await pool.query(
        `INSERT INTO question_papers (subject_id, semester, year, exam_type) VALUES ($1, $2, $3, $4) RETURNING id`,
        [subject_id, semester || null, year || null, exam_type || null]
      );
      paper_id = newPaper.rows[0].id;
    }

    const questionsArray = splitQuestions(text);
    const insertedQuestions = [];

    for (const qText of questionsArray) {
      const parsedHints = req.body.hints ? (typeof req.body.hints === 'string' ? JSON.parse(req.body.hints) : req.body.hints) : {};

      const metadata_hints = JSON.stringify({
        inferred_from_filename: parsedHints,
        final_confirmed_values: { semester, year, exam_type }
      });

      const textHash = generateTextHash(qText);
      let embeddingVector;

      const existingCheck = await pool.query(
        'SELECT embedding FROM questions WHERE text_hash = $1 LIMIT 1',
        [textHash]
      );

      if (existingCheck.rows.length > 0) {
        embeddingVector = existingCheck.rows[0].embedding;
        if (typeof embeddingVector !== 'string') embeddingVector = JSON.stringify(embeddingVector);
      } else {
        const rawVector = await generateEmbedding(qText);
        embeddingVector = JSON.stringify(rawVector);
      }

      const qResult = await pool.query(
        `INSERT INTO questions (paper_id, uploader_id, raw_text, clean_text, image_url, metadata_hints, text_hash, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, clean_text`,
        [paper_id, uploader_id, qText, qText, image_url, metadata_hints, textHash, embeddingVector]
      );
      insertedQuestions.push(qResult.rows[0]);
    }

    await pool.query('COMMIT');
    res.status(201).json({
      message: `Successfully saved ${insertedQuestions.length} question(s).`,
      questions: insertedQuestions,
      image_url
    });

  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Confirm Upload Error:', err);
    res.status(500).json({ error: 'Server error during final upload' });
  }
});

router.post('/parse-filename', verifyToken, async (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'Filename required' });
  const hints = await parseFilenameWithLLM(filename);
  res.status(200).json({ hints });
});

export default router;