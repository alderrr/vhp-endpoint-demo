const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let statusDescription = `Internal Server Error`;

  console.error(err);

  if (err.name === "Missing Environment Variable: Drive") {
    statusCode = 500;
    statusDescription =
      "Internal Server Error - Missing Environment Variable: Drive";
  }

  if (err.name === "Invalid XML body") {
    statusCode = 400;
    statusDescription = "Bad Request - Invalid XML body";
  }

  res.status(statusCode).json({
    statusCode: statusCode,
    statusDescription: statusDescription,
    data: "FAILED",
  });
};

module.exports = errorHandler;
