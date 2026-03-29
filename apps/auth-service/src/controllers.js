import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@jiraclone/database';
import { z } from '@jiraclone/shared';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

export const register = async (req, res) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const [existingUser] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      `INSERT INTO users (name, email, passwordHash)
       VALUES (?, ?, ?)`,
      [name || null, email, passwordHash]
    );

    const user = {
      id: result.insertId,
      email,
      name: name || null
    };

    const token = generateToken(user.id);

    res.status(201).json({ user, token });

  } catch (error) {
    console.error('[auth-service] register failed:', error);
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const [rows] = await db.execute(
      'SELECT id, email, name, passwordHash FROM users WHERE email = ?',
      [email]
    );

    const user = rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.status(200).json({
      user: { id: user.id, email: user.email, name: user.name },
      token
    });

  } catch (error) {
    console.error('[auth-service] login failed:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await db.execute(
      'SELECT id, email, name FROM users WHERE id = ?',
      [decoded.userId]
    );

    const user = rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });

  } catch (error) {
    console.error('[auth-service] getMe failed:', error);
    res.status(401).json({ error: 'Not authorized' });
  }
};