import express from 'express';
import pool from '../db.js';
import verifyToken from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/universities', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM universities ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch universities' });
  }
});

router.post('/universities', verifyToken, async (req, res) => {
  try {
    const { name, short_code } = req.body;
    const check = await pool.query('SELECT * FROM universities WHERE name = $1 OR short_code = $2', [name, short_code]);
    if (check.rows.length > 0) return res.status(400).json({ error: 'University already exists' });

    const result = await pool.query(
      'INSERT INTO universities (name, short_code) VALUES ($1, $2) RETURNING *',
      [name, short_code]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/courses', async (req, res) => {
  try {
    const { university_id } = req.query;
    if (!university_id) return res.status(400).json({ error: 'university_id is required' });

    const result = await pool.query('SELECT * FROM courses WHERE university_id = $1 ORDER BY name ASC', [university_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

router.post('/courses', verifyToken, async (req, res) => {
  try {
    const { university_id, name, code } = req.body;
    
    const check = await pool.query(
      'SELECT * FROM courses WHERE university_id = $1 AND (name = $2 OR code = $3)', 
      [university_id, name, code]
    );
    if (check.rows.length > 0) return res.status(400).json({ error: 'Course already exists in this university' });

    const result = await pool.query(
      'INSERT INTO courses (university_id, name, code) VALUES ($1, $2, $3) RETURNING *',
      [university_id, name, code]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/subjects', async (req, res) => {
  try {
    const { course_id } = req.query;
    if (!course_id) return res.status(400).json({ error: 'course_id is required' });

    const result = await pool.query('SELECT * FROM subjects WHERE course_id = $1 ORDER BY name ASC', [course_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

router.post('/subjects', verifyToken, async (req, res) => {
  try {
    const { course_id, name, code } = req.body;
    
    const check = await pool.query(
      'SELECT * FROM subjects WHERE course_id = $1 AND (name = $2 OR code = $3)', 
      [course_id, name, code]
    );
    if (check.rows.length > 0) return res.status(400).json({ error: 'Subject already exists in this course' });

    const result = await pool.query(
      'INSERT INTO subjects (course_id, name, code) VALUES ($1, $2, $3) RETURNING *',
      [course_id, name, code]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;