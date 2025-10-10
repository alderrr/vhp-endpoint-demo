const { verifyToken } = require("../helpers/jwt");

const authMiddleware = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";

    if (!auth.startsWith("Bearer ")) {
      return res.status(401).json({
        statusCode: 401,
        statusDescription: "Unauthorized - Missing or Invalid Token",
        data: "FAILED",
      });
    }

    const access_token = auth.slice(7);
    const payload = verifyToken(access_token);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({
      statusCode: 401,
      statusDescription: "Unauthorized - Invalid or Expired Token",
      data: "FAILED",
    });
  }
};

module.exports = authMiddleware;
