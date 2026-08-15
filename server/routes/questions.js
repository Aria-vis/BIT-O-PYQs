import express from 'express';
import pool from '../db.js';
import verifyToken from '../middleware/authMiddleware.js';
import { splitQuestions } from '../utils/textParser.js';

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
      const qResult = await pool.query(
        `INSERT INTO questions (paper_id, uploader_id, raw_text, clean_text)
         VALUES ($1, $2, $3, $4) RETURNING id, clean_text`,
        [paper_id, uploader_id, qText, qText] 
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

export default router;