# IQAC Faculty Profile Management System — Implementation Plan

## Architecture Overview

```
NAAC-Faculty/
├── client/          ← React + Vite + TypeScript (moved from root)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── hooks/
│   │   └── types/
└── server/          ← Node.js + Express + MongoDB
    ├── models/
    ├── routes/
    ├── middleware/
    └── seed/
```

> **Note:** The existing Vite project at root will be restructured — backend goes into `/server`, frontend stays in root (Vite serves from root, API via proxy).

---

## Phase 1 — Backend (Node + Express + MongoDB)

### 1.1 Server Setup
- `server/index.js` — Express app entry, CORS, env config
- `server/.env` — MongoDB URI, JWT secret

### 1.2 Models
| Model | Key Fields |
|-------|-----------|
| `User` | `_id, username, email, password (hashed), role (admin/faculty), isActive, isFirstLogin` |
| `Faculty` | `_id, userId (ref), profileComplete, visibility (per-section map), personalInfo, qualifications, experience, research, publications, awards, memberships, etc.` |

### 1.3 API Routes
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/login` | Public | Login, returns JWT |
| POST | `/api/auth/change-password` | Faculty | Change temp password |
| GET | `/api/admin/faculty` | Admin | List all faculty |
| POST | `/api/admin/faculty` | Admin | Create faculty account |
| PATCH | `/api/admin/faculty/:id/status` | Admin | Toggle active/inactive |
| GET | `/api/faculty/me` | Faculty | Get own profile |
| PUT | `/api/faculty/me` | Faculty | Update own profile |
| PATCH | `/api/faculty/me/visibility` | Faculty | Update visibility settings |
| GET | `/api/profile/:username` | Public | Public profile by username |

### 1.4 Middleware
- `authMiddleware.js` — JWT verification
- `roleMiddleware.js` — Admin/Faculty RBAC
- `firstLoginMiddleware.js` — Redirect if profile incomplete

### 1.5 Seed
- `server/seed.js` — Creates admin user (hardcoded)

---

## Phase 2 — Frontend (React + TypeScript)

### 2.1 Routing Structure
```
/login                   → LoginPage
/admin/dashboard         → AdminDashboard (protected, admin only)
/admin/faculty/new       → AddFacultyPage
/faculty/setup           → ProfileSetupPage (first login)
/faculty/dashboard       → FacultyDashboard (protected)
/faculty/profile/edit    → ProfileEditPage
/profile/:username       → PublicProfilePage (public)
```

### 2.2 Auth Context
- `AuthContext` — stores JWT, user role, isFirstLogin
- Axios interceptors with Bearer token

### 2.3 Core Pages

#### Admin Dashboard
- Faculty list table with status, completion %, actions
- Add Faculty modal (username, email, temp password)
- Toggle active/inactive

#### Faculty Profile Setup (First Login)
- Multi-step wizard with progress bar
- Forced password change on first step
- Incremental save (each section saved independently)
- Sections from PDF:
  1. Personal Information
  2. Academic Qualifications
  3. Teaching Experience
  4. Research & Publications
  5. Awards & Recognition
  6. Professional Memberships
  7. Administrative Roles
  8. Additional Information

#### Faculty Dashboard
- Profile completion progress indicator
- Quick edit links per section
- Visibility toggles
- Shareable public URL

#### Public Profile Page
- Professional university-style layout
- Only renders visibility=true fields
- No auth required

---

## Phase 3 — Faculty Profile Schema (from PDF)

### Personal Information
- Full Name, Date of Birth, Gender
- Designation, Department, Institution
- Employee ID, Date of Joining
- Email (official), Phone
- Photo URL
- Address

### Academic Qualifications
- Degree, Subject/Specialization, University, Year, Class/Grade
- (Multiple entries — dynamic list)

### Teaching Experience
- Institution, Designation, Period (From–To), Level (UG/PG)
- (Multiple entries)

### Research Experience
- Total research experience (years)
- Areas of Specialization

### Publications
- Journal Articles (Author(s), Title, Journal, ISSN, Vol, Issue, Year, Pages, Impact Factor, Indexed in)
- Books/Book Chapters
- Conference Papers

### Ongoing/Completed Projects
- Title, Funding Agency, Amount, Duration, Role (PI/CO-PI), Status

### Awards & Recognition
- Award Name, Awarding Body, Year, Description

### Professional Memberships
- Organization, Membership Type, Member ID

### Administrative/Academic Roles
- Role, Organization, Period

### Additional
- Patents, Consultancy, Extension Activities, etc.

---

## Phase 4 — Design System

### Color Palette (University/IQAC Theme)
- Primary: Deep Navy `#1a2d5a`
- Accent: Gold `#c9a227`
- Background: Off-white `#f8f9fc`
- Card: White `#ffffff`
- Text: Dark `#1e293b`

### Typography
- Headings: `Playfair Display` (Google Fonts) — formal, academic
- Body: `Inter` — clean, readable

### Components
- Sidebar navigation
- Multi-step form wizard
- Dynamic list editors (add/remove rows)
- Toggle switches for visibility
- Profile completion ring/bar
- Public profile card layout

---

## Phase 5 — Implementation Order

1. ✅ Set up server directory, install dependencies
2. ✅ Create Mongoose models (User + Faculty)
3. ✅ Create auth routes + JWT middleware
4. ✅ Create admin routes
5. ✅ Create faculty routes
6. ✅ Create public profile route
7. ✅ Seed admin account
8. ✅ Install client dependencies (react-router-dom, axios, react-hook-form)
9. ✅ Build AuthContext + Axios instance
10. ✅ Build Login page
11. ✅ Build Admin Dashboard
12. ✅ Build Profile Setup wizard (multi-step)
13. ✅ Build Faculty Dashboard
14. ✅ Build Public Profile page
15. ✅ Vite proxy config for API
