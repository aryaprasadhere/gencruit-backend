// models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For password hashing

// Define the schema for the User collection
const UserSchema = new mongoose.Schema(
  {
    // User's full name
    name: {
      type: String,
      required: [true, 'Name is required'], // Validation: must be provided
      trim: true // Removes leading/trailing spaces
    },

    // User's email address
    email: {
      type: String,
      required: [true, 'Email is required'], // Validation: must be provided
      unique: true, // Prevent duplicate emails
      lowercase: true, // Store in lowercase for consistency
      trim: true
    },

    // Hashed password (never store plain text passwords)
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6 // Basic password length validation
    },

    // User role to control access
    role: {
      type: String,
      enum: ['admin', 'recruiter', 'candidate'], // Only these roles allowed
      default: 'candidate' // Default role if not specified
    }
  },
  {
    timestamps: true // Adds createdAt & updatedAt fields automatically
  }
);

// Pre-save hook: runs before saving the document
UserSchema.pre('save', async function (next) {
  // Only hash password if it has been modified or is new
  if (!this.isModified('password')) return next();

  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next(); // Continue saving
  } catch (err) {
    next(err);
  }
});

// Method to compare entered password with hashed password in DB
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Export the User model
module.exports = mongoose.model('User', UserSchema);


