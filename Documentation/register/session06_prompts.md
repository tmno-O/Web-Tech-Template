# GenAI Prompts — Session 06: Security & Auth Logic

**Course:** 960121 Web Technology  
**Session:** 06 — Security & Auth Logic  
**Date:** 2026-05-04  
**Tool:** Claude Code (claude.ai/code)

---

## Prompt 1 — Complete All Session 06 Tasks

**Purpose:** Fix all missing items from the Session 06 checklist including auth_user.json, login route, diagrams, and documentation.

**Prompt used:**

> I'm a university student (Course 960121 - Web Technology, Session 06).
> My project is at /Users/macbookair/Documents/Web-Tech
>
> Please fix ALL missing items below in order. Do not skip any step.
>
> === FIX ITEM 1: Populate auth_user.json ===
> Find auth_user.json in the project (check root, data/, or backend/ folder).
> Populate it with exactly 10 users. Each user must have:
> - id (e.g. "u001")
> - name (first + last name)
> - email (use as username)
> - password (hashed with bcrypt, salt rounds 10)
> - registrationDate (ISO format, e.g. "2025-01-15")
>
> Also create a separate file auth_user_plaintext.json
> (for testing only) with matching email + plaintext password pairs.
>
> === FIX ITEMS 2 & 4: Create Login Route and Mount It ===
> Create backend/routes/login.js with a POST /api/login route that:
> - Reads auth_user.json to find the user by email
> - If user not found → return 401 { message: "Invalid email or password" }
> - If found → use bcrypt.compare(inputPassword, storedHash)
> - If password does not match → return 401 { message: "Invalid email or password" }
> - If matches → use jwt.sign({ id, email }, SECRET_KEY, { expiresIn: '1h' })
> - Return 200 { token }
> - Every single line must have a comment explaining what it does
> - Use require() for bcrypt, jsonwebtoken, fs, and path
>
> Then open server.js and mount the login route:
>   const loginRouter = require('./routes/login');
>   app.use('/api', loginRouter);
>
> === FIX ITEM 5: Git Commit for Login Feature ===
> After creating the login route, run:
>   git add .
>   git commit -m "feat: add JWT-based authentication and password hashing"
>   git push
>
> === FIX ITEM 8: Move Sequence Diagram to Correct Folder ===
> Check if LoginSequenceDiagram.png exists in the project root or Slide/ folder.
> Copy or move it to Documentation/register/LoginSequenceDiagram.png
>
> === FIX ITEM 9: Create Activity Diagram for Registration ===
> Generate an Activity Diagram for the user registration flow as a PNG file.
> Use Python with matplotlib to draw it.
>
> The Activity Diagram must show this flow:
> Start → User fills form →
>   [Frontend validates password rules]
>   → Invalid? → Show error → Back to form
>   → Valid? → POST /api/register →
>   [Backend checks if email exists]
>   → Exists? → Return 409 → Show "Email already registered"
>   → Not exists? → Hash password → Save to auth_user.json → Return 201 → Redirect to login
> End
>
> Save the output as Documentation/register/ActivityDiagram_Register.png
>
> === FINAL STEP ===
> After all fixes are done:
>   git add .
>   git commit -m "feat: complete session 06 security tasks"
>   git push

---

## Prompt 2 — Connect Login Form to Backend API

**Purpose:** Wire the login form in account.html to the POST /api/login backend endpoint so users can actually log in from the website.

**Prompt used:**

> I mean login in website page with login button

**Follow-up:**

> How I test with web page?

**What was built:**
- `js/login.js` — intercepts the login form submit, calls `POST /api/login`, stores the JWT token in `localStorage` on success, and shows success/error messages
- `account.html` — updated to add `id="login-form"`, `id="login-email"`, `id="login-password"`, `id="login-message"`, and `<script src="js/login.js">`
- `backend/server.js` — added `express.static(__dirname)` so the frontend can be accessed at `http://localhost:3001/account.html`

---

## Prompt 3 — Save Prompts and Push to GitHub

**Purpose:** Document all prompts used in this session and push to GitHub for submission.

**Prompt used:**

> create files and save my prompt and then push to github
