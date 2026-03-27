# System Administration SPA

Admin interface for managing platform users and role assignments, served at `/admin/system/`.

## Access

Requires the `admin` role. Authenticated via Firebase with Google provider (shared session across all Haderach apps).

## Features

- **User list** — sortable, searchable table of all platform users with role badges
- **Create user** — modal form for adding new users with role assignment (`user`, `admin`)
- **Edit user** — update display name and roles
- **Delete user** — remove a user from the platform

## Tech stack

- **React 19** + **Vite** (base path `/admin/system/`, build output `dist/admin/system/`)
- **Tailwind CSS** with app-specific color tokens in `src/index.css`
- **@haderach/shared-ui** — `AdminModal`, `UserTable`, `TagBadge`, `agentFetch`, `AuthGate`, `GlobalNav`
- **Agent API** — all data flows through the agent service (`/agent/api/users`), no direct database access

## Development

```bash
npm install
npx vite --port 5175
```

Requires the agent service running locally on port 8080 (Vite proxies `/agent/api` requests).

## Repository structure

```text
admin-system/
├── src/
│   ├── App.tsx               # Main view: user list with UserTable
│   ├── UserDetailModal.tsx   # View/edit user detail modal
│   ├── CreateUserDialog.tsx  # New user creation modal
│   ├── api.ts                # API functions (uses agentFetch from shared-ui)
│   ├── auth/
│   │   ├── AuthGate.tsx      # Auth wrapper (requires admin role)
│   │   ├── AuthUserContext.ts
│   │   ├── accessPolicy.ts
│   │   └── runtimeConfig.ts  # Firebase config loader
│   ├── index.css             # App color tokens
│   └── main.tsx
├── scripts/
│   ├── package-artifacts.sh  # Build artifact packaging
│   └── generate-manifest.mjs # Manifest generation for platform deploy
├── vite.config.ts
└── package.json
```

## Deployment

Follows the standard Haderach app delivery contract:

1. Merge to `main` triggers CI → artifact publish to GCS
2. Platform `deploy.yml` workflow promotes the artifact to Firebase Hosting
3. Artifact path: `gs://<bucket>/admin-system/versions/<commit-sha>/`
