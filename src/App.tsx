import { useCallback, useEffect, useState } from 'react'
import {
  GlobalNav,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Card,
  CardContent,
} from '@haderach/shared-ui'
import { useAuthUser } from './auth/AuthUserContext'
import { UserDetailModal } from './UserDetailModal'
import { CreateUserDialog } from './CreateUserDialog'
import { fetchUsers } from './api'
import type { UserSummary } from './api'
import { Plus, RefreshCw } from 'lucide-react'

export function App() {
  const authUser = useAuthUser()
  const [users, setUsers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchUsers(authUser.getIdToken)
      data.sort((a, b) => a.email.localeCompare(b.email))
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [authUser.getIdToken])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleUserUpdated = useCallback(() => {
    loadUsers()
  }, [loadUsers])

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalNav
        activeAppId="system_administration"
        apps={authUser.accessibleApps}
        adminApps={authUser.accessibleAdminApps}
        userEmail={authUser.email}
        userPhotoURL={authUser.photoURL}
        userDisplayName={authUser.displayName}
        onSignOut={authUser.signOut}
      />

      <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Users</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage platform users and role assignments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadUsers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create user
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-error-bg px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.filter((u) => !u.roles.includes('haderach_user')).map((u) => (
                    <TableRow
                      key={u.email}
                      className="cursor-pointer hover:bg-accent/50"
                      onClick={() => setSelectedUser(u)}
                    >
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell>
                        {[u.firstName, u.lastName].filter(Boolean).join(' ') || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.roles.length > 0 ? (
                            u.roles.map((r) => (
                              <span
                                key={r}
                                className="inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
                              >
                                {r}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-xs">No roles</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {selectedUser && (
        <UserDetailModal
          userEmail={selectedUser.email}
          getIdToken={authUser.getIdToken}
          onClose={() => setSelectedUser(null)}
          onUpdated={handleUserUpdated}
        />
      )}

      {showCreate && (
        <CreateUserDialog
          getIdToken={authUser.getIdToken}
          onClose={() => setShowCreate(false)}
          onCreated={handleUserUpdated}
        />
      )}
    </div>
  )
}
