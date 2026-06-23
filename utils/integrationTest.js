const mongoose = require('mongoose');
const { spawn } = require('child_process');

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}/api/users`;
const MONGO_URI = 'mongodb://localhost:27017/decodelabs_db';

/**
 * Runs a suite of database and REST endpoint integration tests.
 * Validates Mongoose schema constraints, input validations, error responses, and CRUD endpoints.
 */
async function runTests() {
  console.log('--- Starting Integration Tests ---');
  
  // 1. Clean the database first
  console.log('Connecting to database to clean existing users...');
  await mongoose.connect(MONGO_URI);
  await mongoose.connection.db.collection('users').deleteMany({});
  console.log('Database cleaned.');
  await mongoose.disconnect();

  // 2. Start the server as a child process on PORT 5001
  console.log(`Starting server on port ${PORT}...`);
  const serverProcess = spawn('node', ['server.js'], {
    env: { ...process.env, PORT, MONGO_URI }
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server stdout] ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server stderr] ${data.toString().trim()}`);
  });

  // Wait 2 seconds for server to start and connect to DB
  await new Promise(resolve => setTimeout(resolve, 2000));

  let testUserId = null;

  try {
    // Test 1: POST /api/users - Create User (Success)
    console.log('\n--- Test 1: Create User (Success) ---');
    const res1 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John Doe', email: 'john@example.com', age: 25 })
    });
    const body1 = await res1.json();
    console.log(`Status: ${res1.status}`);
    console.log('Body:', body1);
    if (res1.status !== 201 || !body1.user._id) {
      throw new Error('Test 1 failed');
    }
    testUserId = body1.user._id;

    // Test 2: POST /api/users - Schema validation failure (Age < 18)
    console.log('\n--- Test 2: Schema validation failure (Age < 18) ---');
    const res2 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Underage User', email: 'underage@example.com', age: 17 })
    });
    const body2 = await res2.json();
    console.log(`Status: ${res2.status}`);
    console.log('Body:', body2);
    if (res2.status !== 400 || !body2.error.includes('Age must be at least 18')) {
      throw new Error('Test 2 failed');
    }

    // Test 3: POST /api/users - Schema validation failure (Invalid Email)
    console.log('\n--- Test 3: Schema validation failure (Invalid Email) ---');
    const res3 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Invalid Email User', email: 'invalidemail', age: 20 })
    });
    const body3 = await res3.json();
    console.log(`Status: ${res3.status}`);
    console.log('Body:', body3);
    if (res3.status !== 400 || !body3.error.includes('Please enter a valid email address')) {
      throw new Error('Test 3 failed');
    }

    // Test 4: POST /api/users - Unique Email Constraint
    console.log('\n--- Test 4: Unique Email Constraint ---');
    const res4 = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Duplicate John', email: 'john@example.com', age: 30 })
    });
    const body4 = await res4.json();
    console.log(`Status: ${res4.status}`);
    console.log('Body:', body4);
    if (res4.status !== 400 || !body4.error.includes('Email already exists')) {
      throw new Error('Test 4 failed');
    }

    // Test 5: GET /api/users - Read all users
    console.log('\n--- Test 5: Read all users ---');
    const res5 = await fetch(BASE_URL);
    const body5 = await res5.json();
    console.log(`Status: ${res5.status}`);
    console.log('Body Length:', body5.length);
    if (res5.status !== 200 || body5.length !== 1 || body5[0]._id !== testUserId) {
      throw new Error('Test 5 failed');
    }

    // Test 6: PUT /api/users/:id - Update User (Success)
    console.log('\n--- Test 6: Update User (Success) ---');
    const res6 = await fetch(`${BASE_URL}/${testUserId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John Updated', age: 26 })
    });
    const body6 = await res6.json();
    console.log(`Status: ${res6.status}`);
    console.log('Body:', body6);
    if (res6.status !== 200 || body6.user.name !== 'John Updated' || body6.user.age !== 26) {
      throw new Error('Test 6 failed');
    }

    // Test 7: PUT /api/users/:id - Update User with Invalid Age Validation
    console.log('\n--- Test 7: Update User with Invalid Age Validation ---');
    const res7 = await fetch(`${BASE_URL}/${testUserId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ age: 15 })
    });
    const body7 = await res7.json();
    console.log(`Status: ${res7.status}`);
    console.log('Body:', body7);
    if (res7.status !== 400 || !body7.error.includes('Age must be at least 18')) {
      throw new Error('Test 7 failed');
    }

    // Test 8: PUT /api/users/:id - Update User with Invalid ID format
    console.log('\n--- Test 8: Update User with Invalid ID format ---');
    const res8 = await fetch(`${BASE_URL}/invalid-id-format`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test' })
    });
    const body8 = await res8.json();
    console.log(`Status: ${res8.status}`);
    console.log('Body:', body8);
    if (res8.status !== 400 || !body8.error.includes('Invalid ID format')) {
      throw new Error('Test 8 failed');
    }

    // Test 9: DELETE /api/users/:id - Delete User (Success)
    console.log('\n--- Test 9: Delete User (Success) ---');
    const res9 = await fetch(`${BASE_URL}/${testUserId}`, {
      method: 'DELETE'
    });
    const body9 = await res9.json();
    console.log(`Status: ${res9.status}`);
    console.log('Body:', body9);
    if (res9.status !== 200 || body9.user._id !== testUserId) {
      throw new Error('Test 9 failed');
    }

    // Test 10: GET /api/users - Verify empty list
    console.log('\n--- Test 10: Verify empty list ---');
    const res10 = await fetch(BASE_URL);
    const body10 = await res10.json();
    console.log(`Status: ${res10.status}`);
    console.log('Body Length:', body10.length);
    if (res10.status !== 200 || body10.length !== 0) {
      throw new Error('Test 10 failed');
    }

    console.log('\n>>> ALL INTEGRATION TESTS PASSED SUCCESSFULLY! <<<');
  } catch (error) {
    console.error('\n>>> INTEGRATION TEST FAILURE! <<<');
    console.error(error);
    process.exitCode = 1;
  } finally {
    console.log('Stopping server process...');
    serverProcess.kill();
  }
}

runTests();
