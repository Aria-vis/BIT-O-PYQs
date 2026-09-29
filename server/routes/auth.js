import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password_hash, is_verified, verification_token) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email',
      [name, email, hashedPassword, false, otp]
    );

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER || '"BITO PYQs" <no-reply@bitopyqs.com>',
      to: email,
      subject: 'Verify your BITO PYQs Account',
      text: `Your verification code is: ${otp}`,
      html: `<h2>Welcome to BITO PYQs!</h2><p>Your verification code is: <strong>${otp}</strong></p>`
    };

    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
      } else {
        console.log('--- TEST MODE: EMAIL NOT CONFIGURED ---');
        console.log(`To: ${email} | OTP: ${otp}`);
      }
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // We still return success but maybe warn the client
    }

    res.status(201).json({
      message: 'User created successfully! Please verify your email.',
      requireVerification: true,
      email: newUser.rows[0].email
    });

  } catch (error) {
    console.error('Signup Error:', error.message);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (user.is_verified) {
      return res.status(400).json({ error: 'User is already verified' });
    }

    if (user.verification_token !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Mark as verified
    await pool.query('UPDATE users SET is_verified = true, verification_token = null WHERE email = $1', [email]);

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Email verified successfully!',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error('Verify OTP Error:', error.message);
    res.status(500).json({ error: 'Server error during verification' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // Block unverified users
    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in', requireVerification: true });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user;

    if (userResult.rows.length === 0) {
      const dummyHash = 'GOOGLE_AUTH_USER_NO_PASSWORD';
      const newUser = await pool.query(
        'INSERT INTO users (name, email, password_hash, is_verified) VALUES ($1, $2, $3, true) RETURNING id, name, email',
        [name, email, dummyHash]
      );
      user = newUser.rows[0];
    } else {
      user = userResult.rows[0];
      if (!user.is_verified) {
        //Sign in with google, auto verify them
        await pool.query('UPDATE users SET is_verified = true WHERE email = $1', [email]);
      }
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Google login successful!',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error('Google Auth Error:', error.message);
    res.status(500).json({ error: 'Server error during Google authentication' });
  }
});

export default router;