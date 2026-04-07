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

const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, user_id: userId, email },
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
      `INSERT INTO users (name, email, passwordHash) VALUES (?, ?, ?)`,
      [name || null, email, passwordHash]
    );

    const user = {
      id: result.insertId,
      email,
      name: name || null
    };

    const token = generateToken(user.id, email);
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

    const token = generateToken(user.id, user.email);
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

export const githubLogin = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_CALLBACK_URL;
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
  res.redirect(url);
};

export const githubCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL;
  const { code } = req.query;
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }

    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const githubUser = await userRes.json();

    const emailRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const emails = await emailRes.json();
    const primaryEmail = emails.find(e => e.primary)?.email || emails[0]?.email;

    if (!primaryEmail) {
      return res.redirect(`${frontendUrl}/login?error=no_email`);
    }

    const [existing] = await db.execute('SELECT id, email, name FROM users WHERE email = ?', [primaryEmail]);
    let user;

    if (existing.length > 0) {
      user = existing[0];
    } else {
      const defaultPassword = await bcrypt.hash(Math.random().toString(36), 10);
      const [result] = await db.execute(
        `INSERT INTO users (name, email, passwordHash) VALUES (?, ?, ?)`,
        [githubUser.name || githubUser.login, primaryEmail, defaultPassword]
      );
      user = { id: result.insertId, email: primaryEmail, name: githubUser.name || githubUser.login };
    }

    const token = generateToken(user.id, user.email);
    res.redirect(`${frontendUrl}/?token=${token}&userId=${user.id}`);

  } catch (err) {
    console.error('[auth-service] GitHub OAuth Error:', err);
    res.redirect(`${frontendUrl}/login?error=server_error`);
  }
};