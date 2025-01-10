const errorHandler = (err, req, res, next) => {
  //! Status Code 500
  let status = 500;
  let message = "Internal Server Error";

  console.log(err);

  // Response
  res.status(status).json({
    message,
  });
};

module.exports = errorHandler;
