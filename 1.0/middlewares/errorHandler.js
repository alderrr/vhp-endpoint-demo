const errorHandler = (err, req, res, next) => {
  //! Status Code 500
  let status = 500;
  let message = "Internal Server Error";

  console.log(err);

  if (err.message === "Invalid requestor_id") {
    status = 400;
    message = "Invalid requestor_id";
  }

  if (err.message === "Invalid or missing XML body") {
    status = 400;
    message = "Invalid or missing XML body";
  }

  if (err.message === "Invalid client_id or client_secret") {
    status = 401;
    message = "Unauthorized";
  }

  // Response
  res.status(status).send({
    message,
  });
};

module.exports = errorHandler;
