if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
const port = process.env.PORT || 3000;
const router = require("./routers/index");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.text({ type: "application/xml" }));

app.use(router);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Connected to Port: ${port}`);
});
