//middleware/errorHandler.js

//this is the global error-handling middleware in Express.
//it gets triggered when you call 'next(err)' anywhere in your app.

const errorHandler = (err, req, res, next) => {
  //logs the entire error stack trace to the terminal (useful for debugging)
  console.error(err.stack); 

  //check if the error object has a statusCode (like 400, 404, etc.)
  //if not, we default to 500 — meaning internal server error
  const statusCode = err.statusCode || 500;

  //send a structured JSON response back to the client
  res.status(statusCode).json({
    success: false, //tells the client the request failed
    message: err.message || 'Something went wrong on the server!', // human-readable message
  });
};

module.exports = errorHandler; //export so it can be plugged into index.js
