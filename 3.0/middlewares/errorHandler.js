const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  const statusDescriptionMap = {
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    409: "Conflict",
    415: "Unsupported Media Type",
    500: "Internal Server Error",
  };

  const statusDescription =
    err.statusDescription ||
    statusDescriptionMap[statusCode] ||
    "Internal Server Error";

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  return res.status(statusCode).json({
    statusCode,
    statusDescription,
    data: "FAILED",
    error: {
      name: err.name || "Error",
      message: err.message || "Unexpected server error",
    },
    timestamp: new Date().toISOString(),
  });
};

module.exports = errorHandler;
