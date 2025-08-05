//routes/auth.js

//required modules
const express = require('express');
const bcrypt = require('bcryptjs'); //for hashing passworrds
const jwt = require('jsonwebtoken'); //for creating jwt token
const User = require('../models/User'); //Mongoose model for user
const auth = require('../middleware/auth'); //middleware to protect routes
const CustomError = require('../utils/customError'); //custom error handler utility

const { check, validationResult } = require('express-validator'); //for input validation

const router = express.Router(); //create express router

//route POST /api/auth/signup
//signup route (register a new user)
//access-public
//updated with validation prevent empty titles, invalid emails and to avoid garbage text for salary
router.post(
  '/signup',
  [
    //validation middleware
    check('name', 'Name is required').notEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  ],
  async (req, res, next) => {
    //handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new CustomError('Validation failed', 400));
    }

    const { name, email, password } = req.body;

    try {
      //check if user already exists in DB
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return next(new CustomError('User already exists', 400));
      }

      //hash password for secure storage
      const hashedPassword = await bcrypt.hash(password, 10);

      //create new user instance and save to DB
      const newUser = new User({ name, email, password: hashedPassword });
      await newUser.save();

      //send success response
      res.status(201).json({ msg: 'User registered successfully' });
    } catch (err) {
      next(err); //pass to global error handler
    }
  }
);

//route   POST /api/auth/login
//desc    Login route (authenticate user and return token)
//access  Public
router.post('/login', async (req, res, next) => {
  //extract email and password from request body
  const { email, password } = req.body;

  try {
    //Find the user by email
    const user = await User.findOne({ email });

    //If user doesn't exist, return 400 error
    if (!user) return next(new CustomError('Invalid credentials', 400));

    //Compare entered password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);

    //If password doesn't match, return 400 error
    if (!isMatch) return next(new CustomError('Invalid credentials', 400));

    //Create JWT token with user's ID
    const token = jwt.sign(
      { userId: user._id },         //payload
      process.env.JWT_SECRET,       //secret key from .env
      { expiresIn: '1h' }           //token valid for 1 hour
    );

    //Respond with token and minimal user info (excluding password)
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    next(err); //pass to global error handler
  }
});

//route GET /api/auth/protected
//protected test route
// access-private(requires token)
router.get('/protected', auth, (req, res) => {
  res.json({ msg: `Hello ${req.user.userId}, you're authorized!` });
});

//export router for use in main index.js
module.exports = router;
