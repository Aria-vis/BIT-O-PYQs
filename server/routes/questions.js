import express from 'express';
import pool from '../db.js';
import verifyToken from '../middleware/authMiddleware.js';
import { splitQuestions } from '../utils/textParser.js';
import upload from '../middleware/uploadMiddleware.js';
import { preprocessImage, runOCR } from '../utils/ocrParser.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { parseFilenameWithLLM } from '../utils/llmFallback.js';
import { generateEmbedding, generateTextHash, initModel } from '../utils/embeddings.js';
import rateLimit from 'express-rate-limit';

initModel().catch(console.error);

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many requests, please try again later.' }
});

router.post('/text', verifyToken, aiLimiter, async (req, res) => {
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

router.post('/image/confirm', verifyToken, aiLimiter, upload.single('image'), async (req, res) => {
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

router.get('/:id/duplicates', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const targetQuery = await pool.query(
      `SELECT q.embedding, qp.subject_id 
       FROM questions q
       JOIN question_papers qp ON q.paper_id = qp.id 
       WHERE q.id = $1`, 
      [id]
    );

    if (targetQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    let { embedding, subject_id } = targetQuery.rows[0];

    const embeddingString = typeof embedding === 'string' ? embedding : JSON.stringify(embedding);
    const matchQuery = await pool.query(
      `SELECT q.id, q.clean_text, 1 - (q.embedding <=> $1::vector) AS similarity
       FROM questions q
       JOIN question_papers qp ON q.paper_id = qp.id
       WHERE q.id != $2 
       AND qp.subject_id = $3 
       AND 1 - (q.embedding <=> $1::vector) > 0.70
       ORDER BY similarity DESC 
       LIMIT 5`,
      [embeddingString, id, subject_id]
    );

    res.json({ matches: matchQuery.rows });
  } catch (err) {
    console.error('Duplicate search crash:', err);
    res.status(500).json({ error: 'Failed to search for duplicates' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM questions WHERE id = $1', [id]);
    res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { university_id, course_id, subject_id, year, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let queryParams = [];
    let whereClauses = [];
    let paramIndex = 1;

    let baseQuery = `
      FROM questions q
      JOIN question_papers qp ON q.paper_id = qp.id
      JOIN subjects s ON qp.subject_id = s.id
      JOIN courses c ON s.course_id = c.id
      WHERE 1=1
    `;

    if (university_id) {
      whereClauses.push(`c.university_id = $${paramIndex++}`);
      queryParams.push(university_id);
    }
    if (course_id) {
      whereClauses.push(`s.course_id = $${paramIndex++}`);
      queryParams.push(course_id);
    }
    if (subject_id) {
      whereClauses.push(`qp.subject_id = $${paramIndex++}`);
      queryParams.push(subject_id);
    }
    if (year) {
      whereClauses.push(`qp.year = $${paramIndex++}`);
      queryParams.push(year);
    }
    if (search) {
      whereClauses.push(`q.clean_text ILIKE $${paramIndex++}`);
      queryParams.push(`%${search}%`);
    }

    const whereString = whereClauses.length > 0 ? ' AND ' + whereClauses.join(' AND ') : '';

    const countQuery = `SELECT COUNT(*) ${baseQuery} ${whereString}`;
    const totalRes = await pool.query(countQuery, queryParams);
    const totalQuestions = parseInt(totalRes.rows[0].count);

    const dataQuery = `
      SELECT q.id, q.clean_text, q.image_url, qp.semester, qp.year, qp.exam_type, s.name as subject_name
      ${baseQuery} ${whereString}
      ORDER BY q.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    queryParams.push(limit, offset);
    
    const { rows } = await pool.query(dataQuery, queryParams);

    res.json({
      questions: rows,
      totalPages: Math.ceil(totalQuestions / limit),
      currentPage: parseInt(page),
      totalQuestions
    });

  } catch (err) {
    console.error('Error fetching questions:', err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

export default router;