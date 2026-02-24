const jwt = require("jsonwebtoken");

function signCmsToken(payload) {
  return jwt.sign(payload, process.env.CMS_JWT_SECRET, {
    expiresIn: "1h",
  });
}

function verifyCmsToken(token) {
  return jwt.verify(token, process.env.CMS_JWT_SECRET);
}

module.exports = {
  signCmsToken,
  verifyCmsToken,
};
