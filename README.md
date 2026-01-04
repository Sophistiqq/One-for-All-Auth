Here is a clean, professional `README.md` tailored for GitHub. It focuses strictly on the authentication architecture and ignores the HR/Applicant logic as requested.

---

```markdown
# Elysia + Bun Authentication Module

A high-performance, secure authentication backend built with [Bun](https://bun.sh) and [ElysiaJS](https://elysiajs.com). This module implements a complete JWT-based auth flow with HTTP-only cookies, password hashing, and custom route protection macros.

## ⚡ Features

- **Runtime**: Native Bun runtime for high-speed execution.
- **Security**:
  - Passwords hashed using `Bun.password` (Argon2 default).
  - JWTs stored in **HTTP-Only, Secure Cookies** (prevents XSS access).
  - CSRF protection via SameSite cookie attributes.
- **Database**: SQLite (via `bun:sqlite`) for lightweight, zero-config storage.
- **Developer Experience**:
  - Custom Elysia **Macro** (`isAuth`) for protecting routes with a single flag.
  - Swagger/OpenAPI documentation auto-generation.

## 🛠️ Installation

1. **Prerequisites**: Ensure you have [Bun](https://bun.sh) installed.
   ```bash
   curl -fsSL [https://bun.sh/install](https://bun.sh/install) | bash

```

2. **Clone & Install**:
```bash
git clone <your-repo-url>
cd <your-project-folder>
bun install

```


3. **Run Development Server**:
```bash
bun run dev

```


The server will start at `http://localhost:3000`.

## 🗄️ Database & Seeding

The project uses a local SQLite database (`database.db`). On the first run, it automatically creates the `users` table and seeds a default **Admin** user.

**Default Credentials:**

* **Username:** `admin`
* **Password:** `password`

### Schema (`users`)

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Hashed
    role TEXT NOT NULL DEFAULT 'user',
    created_at DATETIME,
    updated_at DATETIME
);

```

## 🔐 Authentication Endpoints

Base URL: `/auth`

### 1. Register

Create a new user account.

* **POST** `/register`
* **Body:**
```json
{
  "username": "jdoe123",
  "password": "securePassword!",
  "email": "john@example.com"
}

```



### 2. Login

Authenticates the user and sets the `auth_cookie`.

* **POST** `/login`
* **Body:**
```json
{
  "username": "jdoe123",
  "password": "securePassword!"
}

```


* **Response:** `200 OK` (Set-Cookie header present)

### 3. Get Current User (Protected)

Retrieves the profile of the currently logged-in user.

* **POST** `/me`
* **Headers:** Requires valid Cookie.
* **Response:**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@example.com"
}

```



### 4. Logout

Invalidates the session by removing the cookie.

* **POST** `/logout`

## 🛡️ Protecting Routes (Developer Guide)

This project uses a custom Elysia **Macro** defined in `src/plugins/authValidator.ts`. You do not need to manually verify tokens in your handlers.

To protect a route, simply add `{ isAuth: true }` to the route configuration.

### Example Usage:

```typescript
import { Elysia } from "elysia";
import { validator } from "./plugins/authValidator";

export const myProtectedRoutes = new Elysia()
  .use(validator) // 1. Register the plugin
  
  // Public Route
  .get("/public", () => "Hello World")
  
  // Protected Route
  .get("/dashboard", ({ user }) => {
    // 'user' contains the User ID extracted from the token
    return `Welcome back, user ${user}`;
  }, { 
    isAuth: true // 2. Enable protection
  });

```

## 📂 Project Structure (Auth Only)

```
src/
├── auth.ts                 # Auth routes (login, register, me)
├── dbconfig.ts             # DB connection, schema setup, & seeders
├── index.ts                # App entry point
└── plugins/
    └── authValidator.ts    # JWT config & 'isAuth' macro logic

```

## ⚠️ Configuration Note

Currently, the JWT secret is set to `"Roi"` in `src/plugins/authValidator.ts`. For production, ensure you move this to an environment variable:

```typescript
// .env
JWT_SECRET="your-super-secure-secret"

// src/plugins/authValidator.ts
.use(jwt({
    secret: process.env.JWT_SECRET!,
    ...
}))

```

```

### Would you like me to help you extract the `JWT_SECRET` into a `.env` file to make the project production-ready?

```
