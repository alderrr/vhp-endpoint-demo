const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let statusDescription = "Internal Server Error";

  if (err.name === "Drive is required.") {
    statusCode = 400;
    statusDescription = "Bad Request - Drive is required";
  }

  if (err.name === "Invalid XML body.") {
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
