// routes/auth.js

// =============================
// Required Modules
// =============================
const express = require('express');
const jwt = require('jsonwebtoken'); // for creating JWT tokens
const { check, validationResult } = require('express-validator'); // for input validation

// =============================
// Local Imports
// =============================
const User = require('../models/User'); // Mongoose model for user
const auth = require('../middleware/auth'); // middleware to protect routes
const CustomError = require('../utils/customError'); // custom error handler utility

// =============================
// Router Setup
// =============================
const router = express.Router();

// =============================
// @route   POST /api/auth/signup
// @desc    Register a new user with optional role (default: candidate)
// @access  Public
// =============================
router.post(
  '/signup',
  [
    // Validation middleware for incoming data
    check('name', 'Name is required').notEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  ],
  async (req, res, next) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new CustomError('Validation failed', 400));
    }

    const { name, email, password, role } = req.body;

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return next(new CustomError('User already exists', 400));
      }

      // Prevent users from signing up as admin directly
      const allowedRoles = ['candidate', 'recruiter'];
      const assignedRole = allowedRoles.includes(role) ? role : 'candidate';

      // Create and save the new user (password hashing is handled in User model pre-save hook)
      const newUser = new User({
        name,
        email,
        password,
        role: assignedRole,
      });

      await newUser.save();

      // Create JWT token with user ID and role
      const token = jwt.sign(
        { userId: newUser._id, role: newUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Send success response
      res.status(201).json({
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (err) {
      next(err); // Pass any server errors to global error handler
    }
  }
);

// =============================
// @route   POST /api/auth/login
// @desc    Authenticate user & return token
// @access  Public
// =============================
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return next(new CustomError('Invalid credentials', 400));
    }

    // Compare entered password with hashed password using model method
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new CustomError('Invalid credentials', 400));
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Respond with token and minimal user info
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// =============================
// @route   GET /api/auth/protected
// @desc    Test protected route
// @access  Private (requires token)
// =============================
router.get('/protected', auth, (req, res) => {
  res.json({ msg: `Hello ${req.user.userId}, you're authorized!` });
});

// =============================
// Export Router
// =============================
module.exports = router;

