// middleware/auth.js

const jwt = require('jsonwebtoken');

// Middleware to check if the user is logged in (protects private routes)
const authMiddleware = (req, res, next) => {
  // 1️⃣ Get the Authorization header from the request (expected format: "Bearer <token>")
  const authHeader = req.header('Authorization');

  // 2️⃣ If the token is missing or doesn't start with "Bearer ", block the request
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // 3️⃣ Extract the token part (everything after "Bearer ")
  const token = authHeader.split(' ')[1];

  try {
    // 4️⃣ Verify the token using the secret key from .env
    //     - If valid, we get back the user data that was stored when generating the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5️⃣ Store the decoded user data in req.user so that next middleware/route can use it
    req.user = decoded;

    // 6️⃣ Move to the next middleware or route handler
    next();
  } catch (err) {
    // 7️⃣ If token verification fails (invalid or expired), deny access
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Export so it can be used in other files
module.exports = authMiddleware;
