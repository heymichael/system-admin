import { useCallback, useState } from 'react'
import { Button, Input } from '@haderach/shared-ui'
import { createUser } from './api'
import { X, Loader2 } from 'lucide-react'

const ASSIGNABLE_ROLES = ['user', 'admin'] as const

interface Props {
  getIdToken: () => Promise<string>
  onClose: () => void
  onCreated: () => void
}

export function CreateUserDialog({ getIdToken, onClose, onCreated }: Props) {
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [roles, setRoles] = useState<string[]>(['user'])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleRole = (role: string) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    )
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmedEmail = email.trim().toLowerCase()
      if (!trimmedEmail) {
        setError('Email is required')
        return
      }
      setSaving(true)
      setError(null)
      try {
        await createUser(
          { email: trimmedEmail, firstName: firstName.trim(), lastName: lastName.trim(), roles },
          getIdToken,
        )
        onCreated()
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create user')
      } finally {
        setSaving(false)
      }
    },
    [email, firstName, lastName, roles, getIdToken, onCreated, onClose],
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface rounded-xl border border-border shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Create User</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email <span className="text-error">*</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                First name
              </label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Last name
              </label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-foreground mb-2">Roles</span>
            <div className="flex flex-wrap gap-2">
              {ASSIGNABLE_ROLES.map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer hover:bg-accent/50"
                >
                  <input
                    type="checkbox"
                    checked={roles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="accent-primary"
                  />
                  <span className="text-sm">{role}</span>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-error-bg px-4 py-3 text-sm text-error">{error}</div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
