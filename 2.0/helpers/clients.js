const bcrypt = require("bcryptjs");
const { connectDB } = require("../config/mongodb");

const addClient = async ({ clientId, clientSecret, hotelCode }) => {
  const db = await connectDB();
  const hash = await bcrypt.hash(clientSecret, 10);
  await db.collection("clients").insertOne({
    client_id: clientId,
    client_secret_hash: hash,
    hotel_code: hotelCode,
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

const findClientByIdAndHotel = async (clientId, hotelCode) => {
  const db = await connectDB();
  return db.collection("clients").findOne({
    client_id: clientId,
    hotel_code: hotelCode,
  });
};

const verifyClient = async (clientId, clientSecret, hotelCode) => {
  const client = await findClientByIdAndHotel(clientId, hotelCode);
  if (!client) return null;
  const ok = await bcrypt.compare(clientSecret, client.client_secret_hash);
  return ok ? client : null;
};

module.exports = {
  addClient,
  findAllClients,
  findClientByIdAndHotel,
  verifyClient,
};
