# PrepRoute Admin Panel

A fully functional **Test Management Admin Dashboard** built for PrepRoute — enabling administrators to create structured test blueprints, add MCQ questions, preview content, and publish tests live. Built with React 19, TypeScript, and Vite, connected to a live REST API backend.

---

## 🔗 Links

| | |
|---|---|
| **Live App** | https://preproute-assignment-livid.vercel.app |
| **GitHub Repo** | https://github.com/chandanlog/Preproute-Assignment |
| **Backend API** | https://admin-moderator-backend-staging.up.railway.app |

---

## ✨ Features

### 🔐 Authentication
- Secure login with **field-level validation** (required fields, min password length)
- JWT token persisted in `localStorage` and auto-attached to every API request via Axios interceptor
- `ProtectedRoute` guard redirects unauthenticated users to `/login`
- `PublicRoute` prevents re-login when already authenticated
- Profile dropdown with **Sign Out** support

### 📊 Dashboard
- **Live stat cards** — Total Tests, Live Tests, Draft Tests (computed from API data)
- Full **tests table** with: Test Name, Subject, Topics, Status, Created Date, Actions
- **Real-time search** by test name
- **Filter by Subject** (loaded dynamically from API)
- **Filter by Status** (All / Live / Draft)
- Per-row **actions**: View Preview, Edit (disabled for live tests), Delete
- **Delete confirmation modal** with backdrop blur
- **Toast notifications** for success/error (auto-dismiss 4s)
- Retry button on API failure

### 📝 Step 1 — Create / Edit Test Blueprint
- **Tabbed UI**: Chapterwise / PYQ / Mock Test
- **Cascading dropdowns**: Subject → Topics → Sub-Topics (each fetched from API on selection)
- Test name with duplicate-name error highlighted inline
- **Difficulty selector**: Easy / Medium / Hard
- **Custom number steppers** for marking scheme (Correct Marks, Wrong Marks, Unattempt Marks)
- **Auto-calculated Total Marks** = Total Questions × Correct Marks
- Full **client-side validation** with inline field error messages
- **Edit mode** pre-fills all fields from the existing test

### ❓ Step 2 — Add MCQ Questions
- Question navigator panel (numbered grid, active & filled state indicators)
- Previous / Next navigation
- Per-question editor: Question text, 4 options, correct answer, explanation, difficulty, topic, sub-topic, media URL
- Rich-text toolbar (Bold, Italic, Underline, Link, Align, List, Table, Image, Math)
- Questions bulk-saved to API

### 👁️ Step 3 — Preview & Publish
- Full test summary (name, subject, difficulty, marks, duration, question count)
- All MCQs previewed with correct answer highlighted
- **Publish Now** or **Schedule for Later**
- Live Until options: Always / 1 Week / 2 Weeks / 3 Weeks / 1 Month / Custom date range
- Publish calls `PUT /tests/:id` with `{ status: "live" }`
- Success modal with navigation back to Dashboard

### 🧭 Layout & Navigation
- Collapsible **sidebar** (icon-only on question/preview pages to maximise editor space)
- Active route highlighting for Dashboard and Test Creation
- **Breadcrumb trail** auto-updates per route
- **Mobile responsive** — hamburger menu with slide-in sidebar and backdrop
- Notification bell + profile dropdown in header

---

## 🏗️ Project Structure

```
src/
├── main.tsx                    # React app entry point
├── App.tsx                     # Root router & auth guard wiring
├── index.css                   # Global design system (CSS variables, tokens, animations)
│
├── context/
│   └── AuthContext.tsx         # Global auth state: token, user, login(), logout()
│
├── services/
│   └── api.ts                  # Axios instance + interceptors + all API function calls
│
├── components/
│   ├── Layout.tsx              # Sidebar + header shell, breadcrumbs, mobile menu
│   ├── Layout.css
│   ├── ProtectedRoute.tsx      # Auth guard HOC (ProtectedRoute + PublicRoute)
│   └── PrepRouteLogo.tsx       # SVG brand logo component
│
└── pages/
    ├── Login.tsx / Login.css               # Login page
    ├── Dashboard.tsx / Dashboard.css       # Tests list & management
    ├── TestForm.tsx / TestForm.css         # Create/Edit test (Step 1)
    ├── AddQuestions.tsx / AddQuestions.css # MCQ editor (Step 2)
    └── PreviewPublish.tsx / PreviewPublish.css  # Preview & publish (Step 3)
```

---

## 🔌 API Reference

All API calls are made through `/api` (proxied to the Railway backend).

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Authenticate, receive JWT |
| `GET` | `/subjects` | List all subjects |
| `GET` | `/topics/subject/:id` | Topics for a subject |
| `GET` | `/sub-topics/topic/:id` | Sub-topics for a topic |
| `POST` | `/sub-topics/multi-topics` | Sub-topics for multiple topics |
| `GET` | `/tests` | List all tests |
| `GET` | `/tests/:id` | Get test by ID |
| `POST` | `/tests` | Create a new test |
| `PUT` | `/tests/:id` | Update test / publish (`status: "live"`) |
| `DELETE` | `/tests/:id` | Delete a test |
| `POST` | `/questions/bulk` | Bulk save MCQ questions |
| `POST` | `/questions/fetchBulk` | Fetch questions by ID array |

---

## 🛠️ Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | 19 |
| Language | TypeScript | ~6.0 |
| Build Tool | Vite | 8 |
| Routing | React Router DOM | 7 |
| HTTP Client | Axios | 1.17 |
| Icons | Lucide React | 1.18 |
| Styling | Vanilla CSS | — |
| Deployment | Vercel | — |

---

## 💡 Technical Decisions

### 1. Vanilla CSS over Tailwind CSS
CSS custom properties (`var(--color-primary)`, `var(--border-radius)` etc.) give a centralized, consistent design system without adding a heavy utility-class dependency. Every component uses the same tokens defined in `index.css`, making theming predictable and easy to change.

### 2. Axios Interceptors for Cross-Cutting Concerns
Two global interceptors handle concerns that would otherwise be repeated in every API call:
- **Request interceptor** — reads JWT from `localStorage` and injects `Authorization: Bearer <token>` on every outgoing request automatically.
- **Response interceptor** — normalizes the API response format. The backend returns `{ status: "success", data: ... }` but all components expect `{ success: true, data: ... }`. The interceptor adds `success: true` when `status === "success"`, so no page-level code needs to handle both formats.

### 3. Vercel Rewrite Proxy to Eliminate CORS
The browser cannot call `https://admin-moderator-backend-staging.up.railway.app` directly from `https://preproute-assignment-livid.vercel.app` — the backend CORS policy blocks it. Instead, all API calls go to `/api/*` on the Vercel domain, and `vercel.json` rewrites them server-side to the Railway backend. Server-to-server calls have no CORS restrictions.

```
Browser → /api/auth/login  →  Vercel Edge  →  Railway backend
                                  (proxy, no CORS)
```

### 4. `VITE_API_BASE_URL` Defaults to `/api`
`api.ts` uses `import.meta.env.VITE_API_BASE_URL || '/api'`. This means:
- **Local dev**: Vite's built-in proxy (`vite.config.ts`) forwards `/api` to the backend.
- **Vercel production**: `vercel.json` rewrites handle `/api` — no environment variable needed.

If `VITE_API_BASE_URL` is set to the full backend URL in Vercel's env vars, it bypasses the proxy and causes CORS. **It must not be set** (or set to `/api`).

### 5. ProtectedRoute + PublicRoute HOC Pattern
Authentication logic is fully separated from page components. `ProtectedRoute` checks the auth context and redirects to `/login` if unauthenticated. `PublicRoute` does the inverse — redirects logged-in users away from `/login`. Pages themselves contain zero auth logic.

### 6. Cascading Dropdown UUID Resolution
The backend `GET /tests` returns subject names as strings in the response, but `POST /tests` expects subject UUIDs. The `TestForm` resolves this by:
1. Fetching the subjects list on mount
2. Storing the selected UUID in state (not the display name)
3. In edit mode, matching the stored name back to a UUID via the subjects list

### 7. Auto-calculated Total Marks
`useEffect` watches `totalQuestions` and `correctMarks` and automatically computes `totalMarks = totalQuestions × correctMarks`. This reduces user error and keeps the marking scheme consistent.

### 8. Sidebar Collapse on Editor Pages
The sidebar collapses to icon-only mode when the route contains `/questions` or `/preview`. This gives the question editor and preview page the maximum horizontal space without requiring a separate layout component.

---

## 🚀 Deployment

### Vercel (Frontend)

`vercel.json` at the repo root configures two rewrites:
1. **API proxy** — forwards `/api/*` to the Railway backend
2. **SPA fallback** — serves `index.html` for all other routes (required for React Router client-side routing)

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://admin-moderator-backend-staging.up.railway.app/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Vercel Environment Variables:**
| Key | Value |
|---|---|
| `VITE_API_BASE_URL` | `/api` *(or leave unset)* |

### Backend (Railway)
The REST API is hosted on Railway. No changes were made to the backend.

---

## ⚙️ Local Development

```bash
# 1. Clone the repo
git clone https://github.com/chandanlog/Preproute-Assignment.git
cd Preproute-Assignment

# 2. Install dependencies
npm install

# 3. Start the dev server (Vite auto-proxies /api to Railway)
npm run dev
```

Open: **http://localhost:5173**

> No `.env` file is needed. The Vite proxy in `vite.config.ts` handles `/api` forwarding automatically.

---

## 📦 Build

```bash
npm run build      # TypeScript check + Vite production bundle → dist/
npm run preview    # Preview the production build locally
npm run lint       # Run ESLint
```

---

## 🐛 Known Issues & Fixes Applied

| Issue | Root Cause | Fix Applied |
|---|---|---|
| CORS error on Vercel login | `VITE_API_BASE_URL` was set to the direct backend URL | Use Vercel rewrite proxy; set env var to `/api` |
| "Failed to fetch tests" after successful API call | API returns `{ status: "success" }` but code checked `.success` | Added Axios response interceptor to normalize format |
| Duplicate test name shows generic error | Error handler read `.message` not `.errors[0].msg` | Updated handler to extract field-level errors and highlight the Name field inline |
| Subject UUID vs name mismatch | `GET /tests` returns names; `POST /tests` needs UUIDs | Fetch subjects list and resolve name→UUID in form logic |

---

## 📁 Scripts Reference

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server with HMR |
| `npm run build` | TypeScript compile + Vite production build |
| `npm run preview` | Serve the production `dist/` locally |
| `npm run lint` | Run ESLint on all source files |

---

## 📄 License

This project is submitted as part of the PrepRoute frontend assignment.
