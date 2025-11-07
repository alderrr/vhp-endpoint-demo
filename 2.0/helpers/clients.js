const bcrypt = require("bcryptjs");
const { connectDB } = require("../config/mongodb");

const addClient = async ({ clientId, clientSecret }) => {
  const db = await connectDB();
  const hash = await bcrypt.hash(clientSecret, 10);
  await db.collection("clients").insertOne({
    client_id: clientId,
    client_secret_hash: hash,
    created_at: new Date(),
  });
};

const findAllClients = async () => {
  const db = await connectDB();
  return db
    .collection("clients")
    .find({}, { projection: { client_secret_hash: 0 } })
    .toArray();
};

const findClientById = async (clientId) => {
  const db = await connectDB();
  return db.collection("clients").findOne({
    client_id: clientId,
  });
};

const verifyClient = async (clientId, clientSecret) => {
  const client = await findClientById(clientId);
  console.log(client);
  if (!client) return null;
  const ok = await bcrypt.compare(clientSecret, client.client_secret_hash);
  return ok ? client : null;
};

module.exports = {
  addClient,
  findAllClients,
  findClientById,
  verifyClient,
};
