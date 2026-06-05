const { verifyToken } = require("../helpers/jwt");

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        statusCode: 401,
        statusDescription: "Unauthorized - Missing Bearer token",
        data: "FAILED",
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        statusCode: 401,
        statusDescription: "Unauthorized - Empty Bearer token",
        data: "FAILED",
      });
    }

    const payload = verifyToken(token);

    if (!payload?.sub) {
      return res.status(401).json({
        statusCode: 401,
        statusDescription: "Unauthorized - Invalid token payload",
        data: "FAILED",
      });
    }

    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({
      statusCode: 401,
      statusDescription: "Unauthorized - Invalid or expired token",
      data: "FAILED",
    });
  }
};

module.exports = authMiddleware;
