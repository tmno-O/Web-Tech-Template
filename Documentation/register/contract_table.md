# API Contract Table — User Registration

**Course:** 960121 Web Technology  
**Feature:** User Registration  
**Last Updated:** 2026-05-04

---

## Endpoint Overview

| Component   | Details                        |
|-------------|-------------------------------|
| Method      | `POST`                        |
| Endpoint    | `/api/register`               |
| Description | Registers a new user account. Validates input, checks for duplicate email, hashes the password, and saves the user to `auth_user.json`. |
| Auth        | None required                 |
| Content-Type | `application/json`           |

---

## Request Body

| Field      | Type   | Required | Validation Rules                                                                 |
|------------|--------|----------|---------------------------------------------------------------------------------|
| `name`     | String | Yes      | Must be a non-empty string                                                       |
| `email`    | String | Yes      | Must be a valid email format (contains `@` and `.`); must be unique in the system |
| `password` | String | Yes      | Minimum 8 characters; at least 1 uppercase letter (A–Z); at least 1 special character from `!@#$%^&*` |

### Example Request Body

```json
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "password": "Secret@1"
}
```

---

## Response Codes

### 201 Created — Registration successful

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Alice Smith",
    "email": "alice@example.com",
    "registrationDate": "2026-05-04T10:30:00.000Z"
  }
}
```

---

### 400 Bad Request — Missing or invalid input

Returned when a required field is missing or the password does not meet the rules.

```json
{
  "error": "Password must be at least 8 characters, include 1 uppercase letter and 1 special character (!@#$%^&*)"
}
```

Other 400 examples:

```json
{ "error": "Name, email, and password are required" }
```

```json
{ "error": "Invalid email format" }
```

---

### 409 Conflict — Email already registered

Returned when the provided email already exists in `auth_user.json`.

```json
{
  "error": "Email already registered"
}
```

---

### 500 Internal Server Error — Server-side failure

Returned when the server fails to read or write `auth_user.json`, or any unexpected error occurs.

```json
{
  "error": "Internal server error"
}
```

---

## Security Notes

| Concern           | Mitigation                                                                 |
|-------------------|---------------------------------------------------------------------------|
| Password storage  | Passwords are **never** stored in plain text. Hashed with **bcrypt** (salt rounds: 10) before saving. |
| Transport security | All API calls should be made over **HTTPS** in production to prevent man-in-the-middle interception of credentials. |
| Duplicate prevention | Email uniqueness is checked before inserting a new record; returns 409 if already exists. |
| Input validation  | All fields are validated server-side before any database operation is performed. |

---

## Data Saved to `auth_user.json`

Each registered user is stored as an object with the following shape:

```json
{
  "id": "<uuid-v4>",
  "name": "Alice Smith",
  "email": "alice@example.com",
  "password": "$2b$10$...<bcrypt-hash>...",
  "registrationDate": "2026-05-04T10:30:00.000Z"
}
```

> **Note:** The `password` field in the response body (201) omits the hash for security. Only `id`, `name`, `email`, and `registrationDate` are returned to the client.
