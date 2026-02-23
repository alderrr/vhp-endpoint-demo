const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let statusDescription = `Internal Server Error`;

  const detailError = {
    name: err.name || "Error",
    message: err.message || "Unknown error",
    stack: err.stack,
  };

  console.error(err);

  if (err.message === "Missing Environment Variable: Drive") {
    statusCode = 500;
    statusDescription =
      "Internal Server Error - Missing Environment Variable: Drive";
  }

  if (
    err.message === "Invalid XML body" ||
    err.message === "Malformed XML body" ||
    err.message === "Invalid or missing XML body"
  ) {
    statusCode = 400;
    statusDescription = "Bad Request - Invalid XML body";
  }

  if (err.message === "Invalid JSON format") {
    statusCode = 400;
    statusDescription = "Bad Request - Invalid JSON format";
  }

  if (err.message === "Unsupported OTA Message Type") {
    statusCode = 400;
    statusDescription = "Bad Request - Unsupported OTA Message Type";
  }

  if (err.message === "Cannot extract hotel code from message") {
    statusCode = 400;
    statusDescription = "Bad Request - Cannot extract hotel code from message";
  }

  if (err.message === "Invalid token") {
    statusCode = 401;
    statusDescription = "Unauthorized - Invalid token";
  }

  res.status(statusCode).json({
    statusCode: statusCode,
    statusDescription: statusDescription,
    data: "FAILED",
    error: detailError,
  });
};

module.exports = errorHandler;
