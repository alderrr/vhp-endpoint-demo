const { verifyCmsToken } = require("../helpers/cmsJwt");

module.exports = function (req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return res.status(401).json({
        error: "No token",
      });
    const token = authHeader.split(" ")[1];
    const decoded = verifyCmsToken(token);
    req.cmsUser = decoded;
    next();
  } catch {
    return res.status(401).json({
      error: "Invalid token",
    });
  }
};
