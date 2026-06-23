# DecodeLabs Project 3 - Database Integration

A robust Node.js and Express.js backend seamlessly integrated with MongoDB using Mongoose, establishing a digital vault focused on state persistence and data longevity.

---

## 🏛️ The 4 Pillars of Database Integration

The system architecture and data storage layer are structured around four fundamental technical pillars:

### 1. Pillar 1: The Blueprint (Mongoose Schema Design)
Establishes strict database-level schemas with explicit validation constraints to preserve structural data integrity before persistence.
* **Fields & Types**: Defines fields (`name`, `email`, `age`) with explicit Node.js type bindings.
* **Required Properties**: Enforces input presence via schema-level required rules with clean custom messaging.
* **Regex Validations**: Employs a strict email regex format check (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) to reject invalid email structures.
* **Value Boundaries**: Validates numeric boundaries using mongoose minimum value validations (e.g., age must be at least `18`).
* **Metadata Auditing**: Automatically tracks record creation and modification times through Mongoose `{ timestamps: true }`.

### 2. Pillar 2: The Bridge (Secure Connection Logic)
Maintains secure, environment-driven connections to the database using `dotenv` and `mongoose`.
* **Zero-Hardcoding Configuration**: Uses `.env` files to store connection strings securely away from codebase logic.
* **Graceful Exceptions**: Validates env presence at boot time and stops execution gracefully if database parameters are missing.
* **Runtime Event Tracking**: Monitors the active MongoDB connection stream for unexpected run-time disconnects or critical socket errors.

### 3. Pillar 3: The Action (RESTful API CRUD Layer)
Implements clean REST endpoints that map standard HTTP protocol methods directly to corresponding Mongoose queries.
* **POST `/api/users`**: Invokes `User.create` to store new user documents.
* **GET `/api/users`**: Queries the database using `User.find({})` to fetch all user entries.
* **PUT `/api/users/:id`**: Performs target updates using `User.findByIdAndUpdate` with validation checks configured to run upon edit (`runValidators: true`).
* **DELETE `/api/users/:id`**: Deletes a specific document using `User.findByIdAndDelete`.

### 4. Pillar 4 (The Shield): NoSQL Injection Protection & Security
Implements defense-in-depth measures against malicious inputs and invalid requests.
* **Input Sanitization**: Destructures and validates incoming requests to strip out arbitrary MongoDB operators (e.g., query selectors like `$gt` or `$ne`).
* **Pre-emptive ID Validation**: Validates the structure of the incoming hex string prior to query execution using `mongoose.Types.ObjectId.isValid(id)` to prevent CastError triggers and MongoDB driver crashes.
* **Clean Error Propagation**: Standardizes MongoDB code violations (e.g., error `11000` duplicate key constraints, validation failures, schema cast errors) and transforms them into standard API-friendly messages.

---

## 🔌 API Endpoints Mapping

| Method | Endpoint | Description | Request Body Example | Success Status |
| :--- | :--- | :--- | :--- | :---: |
| **POST** | `/api/users` | Register a new user | `{"name": "John Doe", "email": "john@example.com", "age": 25}` | **`201 Created`** |
| **GET** | `/api/users` | Fetch all registered users | *None* | **`200 OK`** |
| **PUT** | `/api/users/:id` | Update an existing user | `{"name": "John Updated", "age": 26}` | **`200 OK`** |
| **DELETE** | `/api/users/:id` | Remove a user by ID | *None* | **`200 OK`** |

---

## 🛠️ Installation & Setup Instructions

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **MongoDB** (Running instance locally on port `27017` or a MongoDB Atlas URI)

### 1. Install Dependencies
Run the installation command in your terminal to setup package modules:
```bash
npm install
```

### 2. Configure Environment Variables
Copy the template `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Open `.env` and specify your database port and target connection URI:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/decodelabs_db
```

### 3. Start the Web Server
Launch the server in production mode:
```bash
node server.js
```
The server will boot up and establish connection to your MongoDB instance:
```stdout
[INFO] Server is running on port 5000
[INFO] Successfully connected to MongoDB database.
```

---

## 🧪 Testing Guide

This project includes a comprehensive suite of **10 Integration Tests** targeting database states and API endpoints. 

### How to Run the Tests
Ensure MongoDB is running locally (or via your configured connection string) and run:
```bash
npm test
```

### Integration Test Scenarios Summary
The test suite performs the following sequential actions:

1. **Test 1: Create User (Success)** — Verifies a standard user object with correct values can be saved.
2. **Test 2: Schema validation failure (Age < 18)** — Verifies database rejects registrations below age 18.
3. **Test 3: Schema validation failure (Invalid Email)** — Confirms regex rejection of malformed emails.
4. **Test 4: Unique Email Constraint** — Tests that duplicates of existing emails are rejected.
5. **Test 5: Read all users** — Confirms retrieval of the stored database user list.
6. **Test 6: Update User (Success)** — Verifies target field updates function correctly.
7. **Test 7: Update User with Invalid Age Validation** — Confirms validation remains active during resource updates.
8. **Test 8: Update User with Invalid ID format** — Confirms premature ID structure validation halts incorrect formats.
9. **Test 9: Delete User (Success)** — Validates document cleanup and removal from database.
10. **Test 10: Verify empty list** — Assures database queries return clean, empty states when collections are empty.
