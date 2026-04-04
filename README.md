# System Administration SPA

Admin interface for managing platform users and role assignments, served at `/admin/system/`.

## Access

Requires the `admin` role. Authenticated via Firebase with Google provider (shared session across all Haderach apps).

## Features

- **Users page** — sortable, searchable table of all platform users with role badges. Create, edit, and delete users via modals.
- **Roles page** — toggle matrix for assigning `user` and `admin` roles per user.
- **Apps page** — app permission management with inline editing for labels and granting roles.

## Tech stack

- **React 19** + **Vite** (base path `/admin/system/`, build output `dist/admin/system/`)
- **Tailwind CSS** with app-specific color tokens in `src/index.css`
- **@haderach/shared-ui** — `AppRail`, `AdminModal`, `UserTable`, `TagBadge`, `FeedbackPopover`, `agentFetch`, auth primitives (`BaseAuthUser`, `fetchUserDoc`, `buildDisplayName`), RBAC helpers
- **react-router-dom** — client-side routing (`basename="/admin/system"`) for Users, Roles, and Apps pages
- **Agent API** — all data flows through the agent service (`/agent/api/users`, `/agent/api/apps`, `/agent/api/me`), no direct database access

## Development

```bash
npm install
npx vite --port 5175
```

Requires the agent service running locally on port 8080 (Vite proxies `/agent/api` requests). Set `VITE_AUTH_BYPASS=true` in `.env` to skip auth, or set it to `false` for real auth — a dev-only "Sign in with Google" button appears automatically in local dev (no redirect to haderach-home needed).

## Repository structure

```text
admin-system/
├── src/
│   ├── auth/
│   │   ├── AuthGate.tsx        # Auth wrapper (requires admin role)
│   │   ├── AuthUserContext.ts
│   │   ├── accessPolicy.ts
│   │   └── runtimeConfig.ts    # Firebase config loader
│   ├── pages/
│   │   ├── UsersPage.tsx       # User list + create/edit/delete modals
│   │   ├── RolesPage.tsx       # Role assignment matrix
│   │   └── AppsPage.tsx        # App permission management
│   ├── App.tsx                 # Router shell: AppRail + horizontal tab nav + Outlet
│   ├── UserDetailModal.tsx     # View/edit user detail modal
│   ├── CreateUserDialog.tsx    # New user creation modal
│   ├── api.ts                  # API functions (uses agentFetch from shared-ui)
│   ├── index.css               # App color tokens
│   ├── main.tsx
│   └── vite-env.d.ts
├── scripts/
│   ├── package-artifacts.sh    # Build artifact packaging
│   └── generate-manifest.mjs   # Manifest generation for platform deploy
├── vite.config.ts
└── package.json
```

## Deployment

Follows the standard Haderach app delivery contract:

1. Merge to `main` triggers CI → artifact publish to GCS
2. Platform `deploy.yml` workflow promotes the artifact to Firebase Hosting
3. Artifact path: `gs://<bucket>/admin-system/versions/<commit-sha>/`
