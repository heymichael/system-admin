import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import {
  GlobalNav,
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarInset,
  SidebarTrigger,
  Separator,
} from '@haderach/shared-ui'
import { useAuthUser } from './auth/AuthUserContext'
import { UsersPage } from './pages/UsersPage'
import { RolesPage } from './pages/RolesPage'
import { Users, ShieldCheck } from 'lucide-react'

const NAV_ITEMS = [
  { to: '', label: 'Users', icon: Users, end: true },
  { to: 'roles', label: 'Roles', icon: ShieldCheck },
] as const

function AppLayout() {
  const authUser = useAuthUser()

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalNav
        activeAppId="system_administration"
        apps={authUser.accessibleApps}
        userEmail={authUser.email}
        userPhotoURL={authUser.photoURL}
        userDisplayName={authUser.displayName}
        onSignOut={authUser.signOut}
      />

      <SidebarProvider className="min-h-0 flex-1">
        <Sidebar collapsible="offcanvas">
          <SidebarContent>
            <SidebarGroup className="pt-14">
              <SidebarMenu>
                {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                  <SidebarMenuItem key={to}>
                    <NavLink to={to} end={end}>
                      {({ isActive }) => (
                        <SidebarMenuButton isActive={isActive}>
                          <Icon className="h-4 w-4" />
                          {label}
                        </SidebarMenuButton>
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <header className="flex h-12 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-lg font-semibold">System Administration</span>
          </header>

          <main className="mx-auto w-full max-w-5xl px-6 py-8">
            <Routes>
              <Route index element={<UsersPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="*" element={<Navigate to="" replace />} />
            </Routes>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter basename="/admin/system">
      <Routes>
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  )
}
