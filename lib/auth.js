const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'admin_session';
const SESSION_HOURS = 12;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET environment variable');
  }
  return secret;
}

function createSessionCookie() {
  const token = jwt.sign({ role: 'admin' }, getSecret(), {
    expiresIn: `${SESSION_HOURS}h`,
  });
  const maxAge = SESSION_HOURS * 60 * 60;
  const secure = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
  return `${COOKIE_NAME}=${token}; HttpOnly; ${secure}Path=/; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const cookies = {};
  if (!header) return cookies;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    cookies[key] = decodeURIComponent(val);
  });
  return cookies;
}

function isAuthenticated(req) {
  try {
    const cookies = parseCookies(req);
    const token = cookies[COOKIE_NAME];
    if (!token) return false;
    const payload = jwt.verify(token, getSecret());
    return payload && payload.role === 'admin';
  } catch (err) {
    return false;
  }
}

module.exports = {
  COOKIE_NAME,
  createSessionCookie,
  clearSessionCookie,
  isAuthenticated,
};
