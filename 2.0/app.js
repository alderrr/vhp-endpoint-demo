const dotenv = require("dotenv");
dotenv.config();
const isProduction = process.env.NODE_ENV === "production";

const fs = require("fs");
const https = require("https");
const express = require("express");
const errorHandler = require("./middlewares/errorHandler");
// const morganMiddleware = require("./middlewares/morgan");

const app = express();
const port = process.env.PORT || 3000;
const router = require("./routers/index");

app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(express.json({ limit: "25mb" }));
app.use(
  express.text({
    type: ["application/xml", "application/soap+xml"],
    limit: "25mb",
  })
);

// app.use(morganMiddleware);
app.use(router);
app.use(errorHandler);

if (isProduction) {
  //! Load SSL certificates
  const sslOptions = {
    key: fs.readFileSync(
      `C:\\Certbot\\live\\integration.e1-vhp.com\\privkey.pem`
    ),
    // cert: fs.readFileSync(
    //   `C:\\Certbot\\live\\integration.e1-vhp.com\\cert.pem`
    // ),
    cert: fs.readFileSync(
      `C:\\Certbot\\live\\integration.e1-vhp.com\\fullchain.pem`
    ),
  };

  //! Create and start HTTPS server
  const httpsServer = https.createServer(sslOptions, app);
  httpsServer.listen(port, () => {
    console.log(`Production: HTTPS server running on Port ${port}`);
  });
} else {
  app.listen(port, () => {
    console.log(`Development: Connected to Port ${port}`);
  });
}
