const { getDb } = require('../../lib/mongodb');
const { isAuthenticated } = require('../../lib/auth');

module.exports = async (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await getDb();
    const appointments = await db
      .collection('appointments')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({ appointments });
  } catch (err) {
    console.error('Error fetching appointments:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
};
