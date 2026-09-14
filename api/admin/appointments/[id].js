const { ObjectId } = require('mongodb');
const { getDb } = require('../../../lib/mongodb');
const { isAuthenticated } = require('../../../lib/auth');

const ALLOWED_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

module.exports = async (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id } = req.query;
  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid appointment id' });
  }

  const db = await getDb();
  const collection = db.collection('appointments');

  if (req.method === 'PATCH') {
    const { status } = req.body || {};
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    try {
      const result = await collection.updateOne(
        { _id: objectId },
        { $set: { status } }
      );
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Error updating appointment:', err);
      return res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const result = await collection.deleteOne({ _id: objectId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Error deleting appointment:', err);
      return res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
  }

  res.setHeader('Allow', 'PATCH, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
};
