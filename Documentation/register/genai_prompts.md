# GenAI Prompts — User Registration Feature

**Course:** 960121 Web Technology  
**Feature:** User Registration  
**Last Updated:** 2026-05-04

These are the prompts used to generate the code for the User Registration feature using a Generative AI assistant (Claude Code).

---

## Prompt 1 — Express.js Register Route (`routes/register.js`)

**Purpose:** Generate the Express.js router file that defines the POST `/api/register` endpoint and connects it to the registration handler.

**Prompt used:**

> I am building a Node.js + Express.js backend for my university Web Technology assignment (Course 960121).
> I need you to create a file `backend/routes/register.js` that defines a POST route at `/api/register`.
>
> Requirements:
> - Import Express and create a Router
> - Import the register handler function from `../controllers/registerController.js` (or inline the logic if preferred)
> - Mount the handler on `router.post('/', registerUser)`
> - Export the router
> - Add a file-level header comment explaining what the file does and where it sits in the Logic Flow (Request step)
> - Every line must have a comment explaining what it does
>
> The route will be mounted in `server.js` as `app.use('/api/register', registerRouter)`.
> This is for a graded university assignment so code quality and comments are very important.

---

## Prompt 2 — Register Logic (`routes/register.js` full implementation)

**Purpose:** Generate the complete registration logic — input validation, duplicate email check, bcrypt hashing, UUID generation, and saving to a flat JSON file.

**Prompt used:**

> I am building a Node.js + Express.js backend for my university Web Technology assignment (Course 960121).
> I need you to implement the full POST `/api/register` handler inside `backend/routes/register.js`.
>
> The handler must do the following steps in order, with every line commented:
>
> 1. **Extract** `name`, `email`, `password` from `req.body`
> 2. **Validate** that all three fields are present — return 400 if any is missing
> 3. **Validate email format** — must contain `@` and a `.` — return 400 if invalid
> 4. **Validate password rules:**
>    - At least 8 characters
>    - At least 1 uppercase letter (A–Z)
>    - At least 1 special character from `!@#$%^&*`
>    - Return 400 with a descriptive message if the password fails any rule
> 5. **Read** the user database from `../data/auth_user.json` (a JSON array)
> 6. **Check for duplicate email** — if the email already exists, return 409 Conflict
> 7. **Hash the password** using bcrypt with 10 salt rounds
> 8. **Generate a unique ID** using `crypto.randomUUID()`
> 9. **Build a new user object:** `{ id, name, email, password (hashed), registrationDate }`
> 10. **Append** the new user to the array and **write** it back to `auth_user.json`
> 11. **Return 201 Created** with `{ message, user: { id, name, email, registrationDate } }` (no password in response)
> 12. **Catch** any errors and return 500 Internal Server Error
>
> Dependencies: `bcrypt` (salt rounds 10), `fs` (promises), `path`, `crypto` (built-in).
> Data file: `backend/data/auth_user.json` (a JSON array, initially `[]`).
> This is a graded university assignment — every line must have a comment.
