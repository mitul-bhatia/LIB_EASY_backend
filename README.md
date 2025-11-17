## Backend — LIB_EASY API

### Overview
This backend powers **LIB_EASY**, a lightweight library management platform. It exposes authentication endpoints (sign up, login, logout) and is ready to grow into services for managing books, circulation workflows, and admin reporting—typical requirements for modern library systems where patrons expect self‑service portals and librarians need quick catalog tools.

### Tech Stack
- `Node.js`, `Express 5` – HTTP API and middleware.
- `Prisma ORM` – typed data access targeting a MongoDB cluster.
- `MongoDB` – stores users and (soon) books.
- `JWT + cookies` – session management (currently a single token stored in an HTTP‑only cookie; refresh strategy can be added later).
- `bcryptjs` – password hashing.
- `Zod helpers` – email/password validation utilities.

### Project Structure
```
backend/
├─ prisma/
│  └─ schema.prisma        # Mongo models: User, Book, Role enum
├─ src/
│  ├─ server.js            # Express bootstrap + CORS + routers
│  ├─ routes/
│  │  ├─ auth.js           # Signup/login/logout flows
│  │  └─ dashboard.js      # Placeholder for book listings
│  ├─ middleware/
│  │  └─ auth.js           # JWT helpers and role checks
│  ├─ config/prismaclient.js
│  └─ utils/validators.js
└─ package.json
```

### Getting Started
1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```
2. **Configure environment** – create `.env`:
   ```
   PORT=5000
   DATABASE_URL="mongodb+srv://<user>:<pass>@cluster/<db>?retryWrites=true"
   JWT_SECRET="super-secret-string"
   JWT_EXPIRES_IN="7d"
   FRONTEND_ORIGIN=http://localhost:3000
   ```
3. **Prisma setup**
   ```bash
   npm run prisma:generate
   npm run prisma:push    # creates Mongo collections
   ```
4. **Run the server**
   ```bash
   npm run dev  # hot reload via nodemon
   ```
   Health check lives at `GET /api/health`.

### Authentication Flow
1. **Sign up** (`POST /api/auth/signup`)
   - Validates email/password, hashes password, stores role (`USER` default, optional `ADMIN`).
   - Returns sanitized user object and sets an HTTP‑only `token` cookie (JWT with `{ id, email, role }` that expires in 7 days by default).
2. **Login** (`POST /api/auth/login`)
   - Verifies credentials, re-issues the JWT cookie.
3. **Logout** (`POST /api/auth/logout`)
   - Requires a valid token; clears the cookie.

> The middleware `verifyToken` reads the cookie (or `Authorization: Bearer`) and attaches `req.user`, while `requireAdmin` enforces role-based access. For long-running sessions, consider evolving this into an access/refresh token pair (the middleware already exposes helpers for that upgrade).

### Library Management Roadmap
Based on common LMS practices (catalog management, lending, reservation queues, fines), suggested next steps:
- Complete `routes/dashboard.js` by exposing `GET /api/books`, `POST /api/books/add` (admin only), and loan endpoints.
- Track inventory metadata (`status`, `copies`, `dueDate`) in Prisma models.
- Add activity logs so librarians can audit lending history.
- Implement background jobs (cron) to send due-date reminders.

### Available NPM Scripts
| Script | Description |
| --- | --- |
| `npm run dev` | Start server with nodemon |
| `npm start` | Production start (node server.js) |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:push` | Apply Prisma schema to DB |

### Testing & QA Notes
Automated tests are not in place yet. When adding new endpoints, consider supertest-based API specs (jest or vitest) plus integration tests against a Mongo memory server.

### Known Gaps
- Refresh-token endpoint not yet wired to the routes file.
- `dashboard.js` currently misses a leading slash on `router.get("books"...`).
- No rate limiting or audit logging—add before production.

Feel free to expand this README with new modules (circulation, analytics, search) as the system grows.


