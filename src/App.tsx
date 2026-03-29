import { BrowserRouter, Routes, Route, NavLink, Navigate, Outlet } from 'react-router-dom'
import { GlobalNav } from '@haderach/shared-ui'
import { useAuthUser } from './auth/AuthUserContext'
import { UsersPage } from './pages/UsersPage'
import { RolesPage } from './pages/RolesPage'
import { AppsPage } from './pages/AppsPage'
import { Users, ShieldCheck, LayoutGrid } from 'lucide-react'

const NAV_ITEMS = [
  { to: '', label: 'Users', icon: Users, end: true },
  { to: 'roles', label: 'Roles', icon: ShieldCheck },
  { to: 'apps', label: 'Apps', icon: LayoutGrid },
] as const

function AppLayout() {
  const authUser = useAuthUser()

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <GlobalNav
        activeAppId="system_administration"
        apps={authUser.accessibleApps}
        userEmail={authUser.email}
        userPhotoURL={authUser.photoURL}
        userDisplayName={authUser.displayName}
        onSignOut={authUser.signOut}
      />

      <main className="mx-auto w-full max-w-5xl px-6 py-8">
        <nav className="flex gap-1 border-b border-border mb-6">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors -mb-px ${
                  isActive
                    ? 'border-b-2 border-foreground text-foreground'
                    : 'text-foreground-muted hover:text-foreground'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </main>
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter basename="/admin/system">
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<UsersPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="apps" element={<AppsPage />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
