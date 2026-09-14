const { createSessionCookie } = require('../../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body || {};
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('ADMIN_PASSWORD is not set in environment variables');
      return res.status(500).json({ error: 'Server is not configured. Contact site owner.' });
    }

    if (!password || password !== adminPassword) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    res.setHeader('Set-Cookie', createSessionCookie());
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
};
