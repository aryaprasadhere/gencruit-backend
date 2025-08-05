//utils/customError.js
//this class extends the built-in Error class to allow us to pass a status code easily.
class CustomError extends Error {
  constructor(message, statusCode) {
    super(message); //call built-in Error constructor
    this.statusCode = statusCode; //add a custom status code

    //maintains proper stack trace for where error was thrown (optional am I doing it right?)
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = CustomError;

