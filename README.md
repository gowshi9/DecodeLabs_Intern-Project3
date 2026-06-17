# DecodeLabs Project 2: Backend API Development

## Project Overview

This repository houses the backend services for the **Skill-Based Internship Matching System**. Acting as the **core data engine and nervous system** of the application, this service handles user identity, registers roles (e.g., interns, admins), validates requests syntactically and semantically, and serves as the source of truth for downstream matching algorithms.

---

## Key Features

### 1. In-Memory Data Store
- Employs a lightweight, fast, and thread-safe in-memory `users` array to store registered participants during runtime.

### 2. GET `/users` Endpoint
- Retrieves the complete list of registered users.
- Returns a structured list of users with a flat schema.

### 3. POST `/users` Endpoint
- Registers a new user in the system.
- Enforces strict validation layers before memory persistence.

### 4. Syntactic & Semantic Validation Layers
Before any payload is committed, the following strict checks are performed:
* **Syntactic Validation**:
  * Check that all critical fields (`id`, `name`, `role`) are present.
  * Verify that `id` is strictly of type `number`.
  * Verify that `name` and `role` are non-empty strings.
* **Semantic Validation**:
  * Checks if the user `id` already exists within the active memory list. If a duplicate is detected, registration is blocked.

---

## HTTP Status Codes Chart

| Status Code | Type | Trigger Condition | Response Structure |
| :--- | :--- | :--- | :--- |
| **`200 OK`** | Success | GET request to `/users` retrieves list | JSON array of all registered user objects |
| **`201 Created`** | Success | POST request to `/users` registers new user | JSON object with success message and new user details |
| **`400 Bad Request`**| Client Error| Missing fields, invalid types, duplicate user IDs, or malformed JSON payloads | JSON object with descriptive error message |
| **`500 Internal Server Error`** | Server Error | Unexpected system exception or route handler failure | `{"error": "Internal Server Error"}` |

---

## Local Setup and Execution

### Prerequisites
- Node.js (v18 or higher recommended)
- npm (Node Package Manager)

### 1. Install Dependencies
Initialize and install the required modules:
```bash
npm install
```

### 2. Start the Server
Run the Express application on port 5000:
```bash
node server.js
```

### 3. Send Test Requests

#### Retrieve User List (GET)
```bash
curl -X GET http://localhost:5000/users
```

#### Register User (POST)
```bash
curl -X POST http://localhost:5000/users \
  -H "Content-Type: application/json" \
  -d '{"id": 101, "name": "Alice Smith", "role": "intern"}'
```
