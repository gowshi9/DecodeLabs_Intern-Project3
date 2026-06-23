const mongoose = require('mongoose');

/**
 * Regular expression used to validate emails at the schema level.
 * Prevents invalid email formats from entering the database.
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * User Schema definition.
 * Declares strict type checking and validation constraints to maintain database level integrity.
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [emailRegex, 'Please enter a valid email address']
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [18, 'Age must be at least 18']
  }
}, {
  // Automatically manage createdAt and updatedAt timestamps to support auditing.
  timestamps: true
});

/**
 * Mongoose User Model.
 * Maps application logic queries directly to the 'users' MongoDB collection.
 * @type {mongoose.Model}
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
