const { getDb } = require('../lib/mongodb');

const ALLOWED_TYPES = ['counseling', 'dmit'];

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};
    const {
      type,
      name,
      email,
      phone,
      studentName,
      studentAge,
      preferredDate,
      preferredTime,
      message,
    } = body;

    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid appointment type' });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    if (!preferredDate) {
      return res.status(400).json({ error: 'Preferred date is required' });
    }

    const doc = {
      type,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      studentName: (studentName || '').trim(),
      studentAge: (studentAge || '').trim(),
      preferredDate,
      preferredTime: (preferredTime || '').trim(),
      message: (message || '').trim(),
      status: 'pending',
      createdAt: new Date(),
    };

    const db = await getDb();
    const result = await db.collection('appointments').insertOne(doc);

    return res.status(201).json({ success: true, id: result.insertedId });
  } catch (err) {
    console.error('Error creating appointment:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
};
