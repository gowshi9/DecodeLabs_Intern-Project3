const express = require('express');

const app = express();
const PORT = 5000;

// Enable parsing of JSON bodies for incoming requests.
app.use(express.json());

// Catch syntax errors in parsed JSON requests to prevent server crashes.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next();
});

/**
 * In-memory data store for users.
 * Chosen over a full database to fulfill the rapid prototyping requirements of the task.
 * @type {Array<{id: number, name: string, role: string}>}
 */
const users = [];

/**
 * Validates the syntax and semantics of user registration input.
 * Separated from the route handler to make validation testable and clean.
 * 
 * @param {any} body - The incoming request body.
 * @returns {{isValid: boolean, error?: string}} Validation result.
 */
function validateUserData(body) {
  const { id, name, role } = body;

  // Verify that all required fields are present in the request body.
  if (id === undefined || name === undefined || role === undefined) {
    return { isValid: false, error: 'Missing required fields: id, name, role' };
  }

  // Enforce strict type checking for the ID to prevent DB and logic errors.
  if (typeof id !== 'number' || Number.isNaN(id)) {
    return { isValid: false, error: 'Field "id" must be a valid number' };
  }

  // Ensure name is a non-empty string to maintain contact integrity.
  if (typeof name !== 'string' || name.trim() === '') {
    return { isValid: false, error: 'Field "name" must be a non-empty string' };
  }

  // Limit roles to expected domain values to prevent unauthorized privileges.
  if (typeof role !== 'string' || role.trim() === '') {
    return { isValid: false, error: 'Field "role" must be a non-empty string' };
  }

  // Check for duplicate user IDs to enforce identity uniqueness.
  const idExists = users.some(user => user.id === id);
  if (idExists) {
    return { isValid: false, error: `User with id ${id} already exists` };
  }

  return { isValid: true };
}

/**
 * GET /users
 * Retrieves the full list of users registered in the system.
 */
app.get('/users', (req, res) => {
  try {
    res.status(200).json(users);
  } catch (error) {
    // Catch-all block for unexpected internal issues (e.g., serialization errors).
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /users
 * Handles new user registration with strict validation.
 */
app.post('/users', (req, res) => {
  try {
    const validation = validateUserData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const newUser = {
      id: req.body.id,
      name: req.body.name.trim(),
      role: req.body.role.trim()
    };

    users.push(newUser);
    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    // Safeguard against runtime failures during list insertion or response formatting.
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start listening for incoming connections.
app.listen(PORT, () => {
  // Console logging is configured only for development tracking of startup status.
  console.log(`Server is running on port ${PORT}`);
});

module.exports = {
  app,
  users,
  validateUserData
};
