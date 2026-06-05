const jwt = require("jsonwebtoken");

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing Environment Variable: JWT_SECRET");
  }

  return process.env.JWT_SECRET;
};

const signToken = (payload) => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "30m",
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

module.exports = {
  signToken,
  verifyToken,
};
