// middleware/roleMiddleware.js

//middleware to allow only specific user roles to access a route
module.exports = function authorizeRoles(...allowedRoles) {
  //this function returns another middleware function
  return (req, res, next) => {
    const userRole = req.user.role; // Get the role of the logged-in user

    //check if user's role is in the list of allowed roles
    if (!allowedRoles.includes(userRole)) {
      //if not allowed, respond with 403 Forbidden
      return res.status(403).json({ message: 'Access denied: Unauthorized role' });
    }

    //if allowed, move on to the next middleware or route handler
    next();
  };
};
