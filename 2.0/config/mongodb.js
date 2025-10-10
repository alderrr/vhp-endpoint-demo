const { MongoClient } = require("mongodb");

let db;

const connectDB = async () => {
  if (db) {
    return db;
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(process.env.MONGODB_DBNAME);
  return db;
};

module.exports = { connectDB };
