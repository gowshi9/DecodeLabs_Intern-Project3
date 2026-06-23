require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Enable parsing of JSON bodies for incoming requests.
app.use(express.json());

// Catch syntax errors in parsed JSON requests to prevent server crashes.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.warn('Malformed JSON request received');
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next();
});

// Establish connection to MongoDB.
if (!MONGO_URI) {
  logger.error('CRITICAL: MONGO_URI is not defined in the environment variables.');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    logger.info('Successfully connected to MongoDB database.');
  })
  .catch((err) => {
    logger.error('Failed to establish connection with MongoDB:', err);
    process.exit(1);
  });

// Monitor database connection health status.
mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection runtime error occurred:', err);
});
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection disconnected.');
});

/**
 * Normalizes Mongoose and MongoDB exceptions into API-friendly client responses.
 * Created to consolidate error parsing and ensure clean separation of error handling logic.
 * @param {Error} error - The caught database or runtime error.
 * @param {express.Response} res - Express response object.
 * @returns {express.Response} The formatted error response.
 */
function handleDatabaseError(error, res) {
  // Catch Mongoose schema constraints violations (e.g. min age, email regex).
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(val => val.message);
    logger.warn('Validation error during database query execution:', { messages });
    return res.status(400).json({ error: messages.join(', ') });
  }

  // Catch MongoDB unique constraint violations (specifically for unique email index).
  if (error.code === 11000) {
    logger.warn('Duplicate key violation detected:', { keys: error.keyValue });
    return res.status(400).json({ error: 'Email already exists' });
  }

  // Catch Mongoose type casting errors (typically caused by malformed ObjectId).
  if (error.name === 'CastError') {
    logger.warn(`Type casting failed for path ${error.path} with value ${error.value}`);
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  logger.error('Unhandled server exception encountered:', error);
  return res.status(500).json({ error: 'Internal Server Error' });
}

/**
 * POST /api/users
 * Registers a new user. Performs strict validation based on User Mongoose Schema constraints.
 */
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, age } = req.body;

    // Destructure properties to sanitize input and prevent arbitrary MongoDB operator injection.
    const newUser = await User.create({
      name: name?.trim(),
      email: email?.trim(),
      age
    });

    logger.info(`User registered successfully: ${newUser._id}`);
    res.status(201).json({
      message: 'User registered successfully',
      user: newUser
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

/**
 * GET /api/users
 * Fetches all registered users from the database.
 */
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

/**
 * PUT /api/users/:id
 * Updates an existing user by MongoDB ObjectId, validating fields with schema constraints.
 */
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, age } = req.body;

    // Validate ID format before database query to reject invalid IDs early and avoid Mongo CastError logs.
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn(`Rejected update request due to malformed User ID format: ${id}`);
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    // Build sanitization payload to prevent injecting unvalidated fields or operator syntax.
    const updatePayload = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (email !== undefined) updatePayload.email = email.trim();
    if (age !== undefined) updatePayload.age = age;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updatePayload,
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedUser) {
      logger.warn(`Update target user ID not found: ${id}`);
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User updated successfully: ${updatedUser._id}`);
    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

/**
 * DELETE /api/users/:id
 * Removes a user from the database by MongoDB ObjectId.
 */
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format before executing query.
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn(`Rejected delete request due to malformed User ID format: ${id}`);
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      logger.warn(`Delete target user ID not found: ${id}`);
      return res.status(404).json({ error: 'User not found' });
    }

    logger.info(`User deleted successfully: ${deletedUser._id}`);
    res.status(200).json({
      message: 'User deleted successfully',
      user: deletedUser
    });
  } catch (error) {
    handleDatabaseError(error, res);
  }
});

// Start listening for incoming connections.
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

module.exports = {
  app
};
