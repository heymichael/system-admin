import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  GlobalNav,
  Button,
  UserTable,
  TagBadge,
} from '@haderach/shared-ui'
import type { UserTableColumn } from '@haderach/shared-ui'
import { useAuthUser } from './auth/AuthUserContext'
import { UserDetailModal } from './UserDetailModal'
import { CreateUserDialog } from './CreateUserDialog'
import { fetchUsers } from './api'
import type { UserSummary } from './api'
import { Plus } from 'lucide-react'

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

  const columns = useMemo<UserTableColumn<UserSummary>[]>(() => [
    {
      key: 'email',
      header: 'Email',
      render: (u) => <span className="font-medium">{u.email}</span>,
      sortValue: (u) => u.email.toLowerCase(),
      searchValue: (u) => u.email,
    },
    {
      key: 'name',
      header: 'Name',
      render: (u) =>
        [u.firstName, u.lastName].filter(Boolean).join(' ') || (
          <span className="text-muted-foreground">—</span>
        ),
      sortValue: (u) => [u.firstName, u.lastName].filter(Boolean).join(' ').toLowerCase(),
      searchValue: (u) => [u.firstName, u.lastName].filter(Boolean).join(' '),
    },
    {
      key: 'roles',
      header: 'Roles',
      searchValue: (u) => u.roles.join(' '),
      render: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles.length > 0 ? (
            u.roles.map((r) => <TagBadge key={r} label={r} />)
          ) : (
            <span className="text-muted-foreground text-xs">No roles</span>
          )}
        </div>
      ),
    },
  ], [])

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

      <main className="flex-1 mx-auto w-full max-w-4xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Users</h1>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create user
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-error-bg px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <UserTable
          users={users}
          columns={columns}
          loading={loading}
          onRowClick={setSelectedUser}
          filterFn={(u) => !u.roles.includes('haderach_user')}
        />
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
