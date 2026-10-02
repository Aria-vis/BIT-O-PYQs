import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

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

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: 'Too many OTP attempts, please try again later.' }
});

router.post('/signup', otpLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Generate 6-digit OTP and set expiry to 15 mins from now
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    let user;

    if (userCheck.rows.length > 0) {
      if (userCheck.rows[0].is_verified) {
        return res.status(400).json({ error: 'User already exists!' });
      } else {
        // OVERWRITE unverified user data and resend OTP
        const updatedUser = await pool.query(
          'UPDATE users SET name = $1, password_hash = $2, verification_token = $3, otp_expires_at = $4 WHERE email = $5 RETURNING id, name, email',
          [name, hashedPassword, otp, expiresAt, email]
        );
        user = updatedUser.rows[0];
      }
    } else {
      // Create new user
      const newUser = await pool.query(
        'INSERT INTO users (name, email, password_hash, is_verified, verification_token, otp_expires_at) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email',
        [name, email, hashedPassword, false, otp, expiresAt]
      );
      user = newUser.rows[0];
    }

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER || '"BITO PYQs" <no-reply@bitopyqs.com>',
      to: email,
      subject: 'Verify your BITO PYQs Account',
      text: `Your verification code is: ${otp}`,
      html: `<h2>Welcome to BITO PYQs!</h2><p>Your verification code is: <strong>${otp}</strong> (valid for 15 minutes)</p>`
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        return res.status(500).json({ error: 'Failed to send verification email. Please check the email address or try again later.' });
      }
    } else {
      console.log('--- TEST MODE: EMAIL NOT CONFIGURED ---');
      console.log(`To: ${email} | OTP: ${otp}`);
    }

    res.status(201).json({
      message: 'User created successfully! Please verify your email.',
      requireVerification: true,
      email: user.email
    });

  } catch (error) {
    console.error('Signup Error:', error.message);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

router.post('/verify-otp', otpLimiter, async (req, res) => {
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

    if (user.otp_expires_at && new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    // Mark as verified
    await pool.query('UPDATE users SET is_verified = true, verification_token = null, otp_expires_at = null WHERE email = $1', [email]);

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

router.post('/resend-otp', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (user.is_verified) {
      return res.status(400).json({ error: 'User is already verified' });
    }

    // Generate new 6-digit OTP and set expiry to 15 mins from now
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      'UPDATE users SET verification_token = $1, otp_expires_at = $2 WHERE email = $3',
      [otp, expiresAt, email]
    );

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER || '"BITO PYQs" <no-reply@bitopyqs.com>',
      to: email,
      subject: 'Your new verification code - BITO PYQs',
      text: `Your new verification code is: ${otp}`,
      html: `<h2>Welcome to BITO PYQs!</h2><p>Your new verification code is: <strong>${otp}</strong> (valid for 15 minutes)</p>`
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        return res.status(500).json({ error: 'Failed to send verification email. Please check the email address or try again later.' });
      }
    } else {
      console.log('--- TEST MODE: EMAIL NOT CONFIGURED ---');
      console.log(`To: ${email} | NEW OTP: ${otp}`);
    }

    res.status(200).json({ message: 'A new verification code has been sent to your email.' });

  } catch (error) {
    console.error('Resend OTP Error:', error.message);
    res.status(500).json({ error: 'Server error during resend' });
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