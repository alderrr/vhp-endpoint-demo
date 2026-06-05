const dotenv = require("dotenv");
dotenv.config();

const fs = require("fs");
const path = require("path");
const https = require("https");
const express = require("express");

const router = require("./routers");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";

app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(express.json({ limit: "25mb" }));

app.use(
  express.text({
    type: ["application/xml", "application/soap+xml", "text/xml"],
    limit: "25mb",
  }),
);

app.use(router);

app.use((req, res) => {
  return res.status(404).json({
    statusCode: 404,
    statusDescription: "Not Found",
    data: "FAILED",
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

app.use(errorHandler);

if (isProduction) {
  const sslOptions = {
    key: fs.readFileSync(
      "C:\\Certbot\\live\\integration.e1-vhp.com\\privkey.pem",
    ),
    cert: fs.readFileSync(
      "C:\\Certbot\\live\\integration.e1-vhp.com\\fullchain.pem",
    ),
  };

  https.createServer(sslOptions, app).listen(port, () => {
    console.log(`Production HTTPS server running on port ${port}`);
  });
} else {
  app.listen(port, () => {
    console.log(`Development server running on port ${port}`);
  });
}
