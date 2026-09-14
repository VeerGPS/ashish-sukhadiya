const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'ashish_counseling';

let cachedClient = global._mongoClientPromise;

function getClientPromise() {
  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable');
  }
  if (!cachedClient) {
    const client = new MongoClient(uri);
    cachedClient = client.connect();
    global._mongoClientPromise = cachedClient;
  }
  return cachedClient;
}

async function getDb() {
  const client = await getClientPromise();
  return client.db(dbName);
}

module.exports = { getDb };
