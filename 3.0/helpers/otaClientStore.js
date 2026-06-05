const fs = require("fs/promises");
const path = require("path");
const bcrypt = require("bcryptjs");

const dbPath = path.join(__dirname, "..", "data", "ota-clients.json");

const ensureDb = async () => {
  const dir = path.dirname(dbPath);

  await fs.mkdir(dir, { recursive: true });

  try {
    await fs.access(dbPath);
  } catch {
    await fs.writeFile(
      dbPath,
      JSON.stringify(
        {
          clients: [],
        },
        null,
        2,
      ),
      "utf8",
    );
  }
};

const readDb = async () => {
  await ensureDb();

  const content = await fs.readFile(dbPath, "utf8");

  if (!content.trim()) {
    return {
      clients: [],
    };
  }

  return JSON.parse(content);
};

const writeDb = async (data) => {
  await ensureDb();
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), "utf8");
};

const addOtaClient = async ({ clientId, clientSecret, name }) => {
  const db = await readDb();

  const existingClient = db.clients.find(
    (client) => client.client_id === clientId,
  );

  if (existingClient) {
    return null;
  }

  const clientSecretHash = await bcrypt.hash(clientSecret, 10);

  const client = {
    client_id: clientId,
    client_secret_hash: clientSecretHash,
    name: name || clientId,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: null,
  };

  db.clients.push(client);

  await writeDb(db);

  return {
    client_id: client.client_id,
    name: client.name,
    active: client.active,
    created_at: client.created_at,
    updated_at: client.updated_at,
  };
};

const findOtaClientById = async (clientId) => {
  const db = await readDb();

  return db.clients.find((client) => client.client_id === clientId) || null;
};

const verifyOtaClient = async (clientId, clientSecret) => {
  const client = await findOtaClientById(clientId);

  if (!client || client.active !== true) {
    return null;
  }

  const isValidSecret = await bcrypt.compare(
    clientSecret,
    client.client_secret_hash,
  );

  return isValidSecret ? client : null;
};

const getAllOtaClients = async () => {
  const db = await readDb();

  return db.clients.map(({ client_secret_hash, ...client }) => client);
};

module.exports = {
  addOtaClient,
  findOtaClientById,
  verifyOtaClient,
  getAllOtaClients,
};
