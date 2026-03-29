# System Administration — Architecture

## Overview

Single-page admin app for managing platform users and role assignments, served at `/admin/system/`. No backend service — all data flows through the shared agent service API (`/agent/api/`).

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
                              Firestore (users collection)
```

## Ownership boundaries

| Concern | Owner |
|---------|-------|
| SPA frontend, CI, artifact publish | This repo (`admin-system`) |
| Shared UI components (GlobalNav, UserTable, AdminModal, TagBadge, primitives) | `haderach-home` (`@haderach/shared-ui`) |
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
│   ├── App.tsx                   # Root: GlobalNav + user list + modals
│   ├── CreateUserDialog.tsx      # New user creation modal
│   ├── UserDetailModal.tsx       # View/edit/delete user modal
│   ├── api.ts                    # API functions (agentFetch → /agent/api/users)
│   ├── index.css                 # App color tokens
│   ├── main.tsx
│   └── vite-env.d.ts
├── scripts/
│   ├── package-artifacts.sh      # Tar dist/ + checksums
│   └── generate-manifest.mjs    # Produce manifest.json for platform contract
├── docs/
│   └── architecture.md           # This file
├── .cursor/
│   ├── rules/                    # AI conventions
│   └── skills/
│       └── brand-guidelines/
│           └── SKILL.md
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
| `/admin/system/*` | Firebase Hosting → SPA `index.html` | Client-side routing |
| `/agent/api/**` | Firebase Hosting rewrite → Cloud Run `agent-api` | Shared agent service |

## UI architecture

The SPA uses shared components from `@haderach/shared-ui` (consumed via `file:` protocol from `../haderach-home/packages/shared-ui`):

- **GlobalNav** — cross-app top navigation bar (logo, apps dropdown, user avatar).
- **UserTable** — configurable user list table with column definitions, sorting, type-ahead search, sticky headers, loading/empty states, and row click handler.
- **AdminModal** — generic modal shell with title, close button, scrollable body, optional footer. Used by `UserDetailModal`.
- **TagBadge** — styled pill for role badges.
- **Button** — shadcn button used in create/edit actions.

Layout hierarchy (in `App.tsx`):

```
.min-h-screen (flex column)
├── GlobalNav (top bar)
└── main (centered, max-w-4xl)
    ├── Header (title + Create user button)
    └── UserTable (sortable, searchable user list)
        └── Row click → UserDetailModal
```

The app filters out `haderach_user` role holders from the user list (they're managed separately). Navigation is state-driven (no client-side router). The `GlobalNav` receives accessible apps from the RBAC system via `AuthUserContext`.

## API contract

All API calls go through `agentFetch` from `@haderach/shared-ui`, which prepends `/agent/api` and attaches Firebase ID tokens.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/users` | `GET` | List all platform users |
| `/users` | `POST` | Create a new user |
| `/users/{email}` | `GET` | Fetch user detail (includes allowed vendors) |
| `/users/{email}` | `PATCH` | Update user fields (roles, name) |
| `/users/{email}` | `DELETE` | Remove a user |
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

- Multi-page routing with react-router-dom (task 80)
- App permissions management page (task 77)
- E2E tests
