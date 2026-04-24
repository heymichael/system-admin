# System Administration — Architecture

## Overview

Multi-page admin app for managing platform users, role assignments, and app permissions, served at `/admin/system/`. Uses `react-router-dom` for client-side routing. No backend service — all data flows through the shared agent service API (`/agent/api/`).

## Cursor Rules

Workspace-level Cursor rule coverage and `alwaysApply` settings are tracked in
`../haderach-platform/docs/cursor-rule-matrix.md`.

```
Browser
  │
  ├── GET /admin/system/*  ──►  Firebase Hosting (static SPA)
  │
  └── /agent/api/*  ───────►  Firebase Hosting rewrite
                                   │
                                   ▼
                              Cloud Run (agent-api, FastAPI)
                                   │
                                   ▼
                              Cloud SQL Postgres (users, roles, apps)
```

## Ownership boundaries

| Concern | Owner |
|---------|-------|
| SPA frontend, CI, artifact publish | This repo (`admin-system`) |
| Shared UI components (AppRail, UserTable, AdminModal, TagBadge, FeedbackPopover, primitives) | `haderach-home` (`@haderach/shared-ui`) |
| Auth primitives (BaseAuthUser, fetchUserDoc, buildDisplayName, RBAC helpers) | `haderach-home` (`@haderach/shared-ui`) |
| Agent API endpoints (`/users` CRUD, `/me`) | `agent` repo |
| Firebase Hosting config, routing rewrites, deploy orchestration | `haderach-platform` |

## Repo layout

```
admin-system/
├── src/
│   ├── auth/
│   │   ├── accessPolicy.ts      # RBAC (re-exports from @haderach/shared-ui)
│   │   ├── AuthGate.tsx          # Auth gate (requires admin role)
│   │   ├── AuthUserContext.ts    # React context (AuthUser = BaseAuthUser)
│   │   └── runtimeConfig.ts     # Firebase config from VITE_* env vars
│   ├── pages/
│   │   ├── UsersPage.tsx         # User list + create/edit/delete modals
│   │   ├── RolesPage.tsx         # Role assignment matrix (user, admin)
│   │   └── AppsPage.tsx          # App permission management (granting roles)
│   ├── App.tsx                   # Router shell: GlobalNav + horizontal tab nav + Outlet
│   ├── CreateUserDialog.tsx      # New user creation modal
│   ├── UserDetailModal.tsx       # View/edit/delete user modal
│   ├── api.ts                    # API functions (agentFetch → /agent/api/users, /apps)
│   ├── index.css                 # App color tokens
│   ├── main.tsx
│   └── vite-env.d.ts
├── scripts/
│   ├── package-artifacts.sh      # Tar dist/ + checksums
│   └── generate-manifest.mjs    # Produce manifest.json for platform contract
├── docs/
│   └── architecture.md           # This file
├── .cursor/
│   └── rules/
│       ├── architecture-pointer.mdc
│       ├── branch-safety-reminder.mdc
│       ├── cross-repo-status.mdc
│       ├── pr-conventions.mdc
│       ├── repo-hygiene.mdc
│       ├── service-oriented-data-access.mdc
│       └── todo-conventions.mdc
├── .github/
│   ├── pull_request_template.md
│   └── workflows/
│       ├── ci.yml                # PR checks (lint + build)
│       └── publish-artifact.yml  # Build, package, upload to GCS on push to main
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts                # base: /admin/system/, proxy for local dev
└── README.md
```

## Routing

| Path | Target | Notes |
|------|--------|-------|
| `/admin/system/` | Users page | Default landing (index route) |
| `/admin/system/roles` | Roles page | Role assignment matrix |
| `/admin/system/apps` | Apps page | App permission management |
| `/admin/system/*` | Firebase Hosting → SPA `index.html` | All routes served by SPA |
| `/agent/api/**` | Firebase Hosting rewrite → Cloud Run `agent-api` | Shared agent service |

Client-side routing uses `react-router-dom` with `basename="/admin/system"`.

## UI architecture

The SPA uses shared components from `@haderach/shared-ui` (consumed via `file:` protocol from `../haderach-home/packages/shared-ui`):

- **AppRail** — collapsible left rail for domain navigation with feedback popover and user avatar flyout. Replaces the legacy GlobalNav.
- **UserTable** — configurable user list table with column definitions, sorting, type-ahead search, sticky headers, loading/empty states, and row click handler.
- **AdminModal** — generic modal shell with title, close button, scrollable body, optional footer. Used by `UserDetailModal`.
- **TagBadge** — styled pill for role badges.
- **Input** — shadcn input used in inline editing on the Apps page.
- **Button** — shadcn button used in create/edit actions.

Layout hierarchy (in `App.tsx`):

```
.flex.h-screen
├── AppRail (left rail)
└── main.flex-1 (overflow-y-auto)
    └── .max-w-5xl (centered)
        ├── Horizontal tab nav (Users | Roles | Apps)
        └── <Outlet /> (active page)
```

### Pages

**Users** (index route): User list with create/edit/delete. Row click opens `UserDetailModal`.

**Roles**: Toggle matrix showing each user's assigned roles. Only `user` and `admin` are assignable via the UI; `finance_admin` is managed via the agent API or seed scripts.

**Apps**: Table of app definitions split into "Applications" and "Admin" sections. Inline editing for label and granting roles. Card and Vendor Administration are hidden (not grantable from system admin). Data from `GET /apps` and `PATCH /apps/{id}` endpoints.

## API contract

All API calls go through `agentFetch` from `@haderach/shared-ui`, which prepends `/agent/api` and attaches Firebase ID tokens.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/users` | `GET` | List all platform users |
| `/users` | `POST` | Create a new user |
| `/users/{email}` | `GET` | Fetch user detail (includes allowed vendors) |
| `/users/{email}` | `PATCH` | Update user fields (roles, name) |
| `/users/{email}` | `DELETE` | Remove a user |
| `/apps` | `GET` | List all app definitions with granting roles |
| `/apps/{id}` | `PATCH` | Update app label, granting roles, or sort order (admin-gated) |
| `/me` | `GET` | Fetch authenticated user's roles and profile (via shared `fetchUserDoc`) |

## Authentication

Authentication is centralized at the platform level. This app does not handle sign-in directly.

- **Sign-in (production):** If no Firebase Auth session exists, the app redirects to `/?returnTo=/admin/system/`.
- **Sign-in (local dev):** When `import.meta.env.DEV` is true and no session exists, the app shows a dev-only "Sign in with Google" button instead of redirecting, allowing authentication directly on the app's origin.
- **Authorization:** Role-based access control (RBAC). User roles are resolved at runtime via `fetchUserDoc` (from `@haderach/shared-ui`), which calls `GET /agent/api/me`. Access is granted if the user holds the `admin` role (`APP_GRANTING_ROLES['system_administration']`).
- Auth primitives (`BaseAuthUser`, `fetchUserDoc`, `buildDisplayName`) and RBAC helpers (`APP_CATALOG`, `APP_GRANTING_ROLES`, `hasAppAccess`, `getAccessibleApps`) are imported from `@haderach/shared-ui` — this app does not maintain local copies. `AuthUser` re-exports `BaseAuthUser` directly (no app-specific extensions).
- **Unauthorized:** Access-denied screen with sign-out option.
- **Bypass:** `VITE_AUTH_BYPASS=true` or `?authBypass=1` query param skips auth (local dev).
- **Persistence:** `browserLocalPersistence` — sessions survive tab close (shared across all apps on `haderach.ai` via same-origin IndexedDB).
- **Fail-closed:** If the agent API is unreachable, roles resolve to empty and access is denied.

Config is read from `VITE_FIREBASE_*` env vars at build time (see `.env.example`).

## Build and deploy flow

1. `npm run build` → `dist/admin/system/` (Vite output)
2. Package as `runtime.tar.gz` via `scripts/package-artifacts.sh`
3. Generate `manifest.json` via `scripts/generate-manifest.mjs`
4. Upload to `gs://<bucket>/admin-system/versions/<commit-sha>/`
5. Platform downloads, verifies, extracts into `hosting/public/admin/system/`
6. `firebase deploy --only hosting`

## Local development

```bash
npm install
npx vite --port 5175
```

Requires the agent service running locally on port 8080 (Vite proxies `/agent/api` requests). The dev server also proxies `/assets/` requests to the haderach-home dev server and redirects `/` to the home app for platform sign-in flow.

Set `VITE_AUTH_BYPASS=true` in `.env` for UI-only development without auth. Set to `false` for real auth — the dev-only Google sign-in button appears automatically.

## Security

- Default `noindex, nofollow, noarchive` on SPA and Firebase Hosting responses
- No direct database access — all data through authenticated agent API
- Firebase Auth gate restricts SPA access to users with `admin` role
- `AuthGate` is local to this app (not from shared-ui)

## Deferred

- E2E tests
