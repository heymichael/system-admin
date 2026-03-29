import { useCallback, useEffect, useState } from 'react'
import { TagBadge } from '@haderach/shared-ui'
import { useAuthUser } from '../auth/AuthUserContext'
import { fetchUsers, updateUser } from '../api'
import type { UserSummary } from '../api'
import { Loader2 } from 'lucide-react'

const ALL_ROLES = ['user', 'admin', 'finance_admin'] as const

export function RolesPage() {
  const authUser = useAuthUser()
  const [users, setUsers] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingCell, setSavingCell] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchUsers(authUser.getIdToken)
      data.sort((a, b) => a.email.localeCompare(b.email))
      setUsers(data.filter((u) => !u.roles.includes('haderach_user')))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [authUser.getIdToken])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const toggleRole = useCallback(async (user: UserSummary, role: string) => {
    const cellKey = `${user.email}:${role}`
    setSavingCell(cellKey)
    const newRoles = user.roles.includes(role)
      ? user.roles.filter((r) => r !== role)
      : [...user.roles, role]
    try {
      await updateUser(user.email, { roles: newRoles }, authUser.getIdToken)
      setUsers((prev) =>
        prev.map((u) => u.email === user.email ? { ...u, roles: newRoles } : u),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setSavingCell(null)
    }
  }, [authUser.getIdToken])

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Roles</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Assign or remove roles per user. Changes take effect immediately.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-error-bg px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading...
        </div>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left font-medium px-4 py-3">User</th>
                {ALL_ROLES.map((role) => (
                  <th key={role} className="text-center font-medium px-4 py-3 w-32">
                    <TagBadge label={role} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.email} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{user.email}</div>
                    {(user.firstName || user.lastName) && (
                      <div className="text-xs text-muted-foreground">
                        {[user.firstName, user.lastName].filter(Boolean).join(' ')}
                      </div>
                    )}
                  </td>
                  {ALL_ROLES.map((role) => {
                    const cellKey = `${user.email}:${role}`
                    const isSaving = savingCell === cellKey
                    const hasRole = user.roles.includes(role)
                    return (
                      <td key={role} className="text-center px-4 py-3">
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                        ) : (
                          <input
                            type="checkbox"
                            checked={hasRole}
                            onChange={() => toggleRole(user, role)}
                            className="h-4 w-4 accent-primary cursor-pointer"
                            aria-label={`${role} for ${user.email}`}
                          />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={ALL_ROLES.length + 1} className="text-center py-8 text-muted-foreground">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
