import { useCallback, useEffect, useState } from 'react'
import { Button, Input, AdminModal, TagBadge } from '@haderach/shared-ui'
import { fetchUserDetail, updateUser, deleteUser } from './api'
import type { UserDetail } from './api'
import { Pencil, Trash2, Save, Loader2 } from 'lucide-react'

const ASSIGNABLE_ROLES = ['user', 'admin'] as const

interface Props {
  userEmail: string
  getIdToken: () => Promise<string>
  onClose: () => void
  onUpdated: () => void
}

export function UserDetailModal({ userEmail, getIdToken, onClose, onUpdated }: Props) {
  const [detail, setDetail] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState(false)
  const [editRoles, setEditRoles] = useState<string[]>([])
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchUserDetail(userEmail, getIdToken)
      .then((d) => {
        if (!cancelled) {
          setDetail(d)
          setEditRoles(d.roles)
          setEditFirstName(d.firstName ?? '')
          setEditLastName(d.lastName ?? '')
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load user')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [userEmail, getIdToken])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await updateUser(
        userEmail,
        { roles: editRoles, firstName: editFirstName, lastName: editLastName },
        getIdToken,
      )
      setDetail((prev) => prev ? { ...prev, ...updated } : prev)
      setEditing(false)
      onUpdated()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }, [userEmail, editRoles, editFirstName, editLastName, getIdToken, onUpdated])

  const handleDelete = useCallback(async () => {
    setDeleting(true)
    try {
      await deleteUser(userEmail, getIdToken)
      onUpdated()
      onClose()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to delete')
      setConfirmingDelete(false)
    } finally {
      setDeleting(false)
    }
  }, [userEmail, getIdToken, onUpdated, onClose])

  const toggleRole = (role: string) => {
    setEditRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    )
  }

  const footerContent = detail && !loading ? (
    <div className="flex justify-between">
      <div>
        {confirmingDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-error">Delete this user?</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : null}
              Confirm
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-error hover:text-error hover:bg-error-bg"
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {!editing && (
        <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  ) : undefined

  return (
    <AdminModal title="User Details" onClose={onClose} footer={footerContent}>
      <div className="space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading...
          </div>
        ) : error ? (
          <div className="rounded-md bg-error-bg px-4 py-3 text-sm text-error">{error}</div>
        ) : detail ? (
          <>
            <div className="space-y-3">
              <Field label="Email" value={detail.email} />
              {!editing && (
                <Field
                  label="Name"
                  value={
                    [detail.firstName, detail.lastName].filter(Boolean).join(' ') || '—'
                  }
                />
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">First name</label>
                    <Input
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Last name</label>
                    <Input
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-sm font-medium text-foreground block mb-2">Roles</span>
                  <div className="flex flex-wrap gap-2">
                    {ASSIGNABLE_ROLES.map((role) => (
                      <label
                        key={role}
                        className="flex items-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer hover:bg-accent/50"
                      >
                        <input
                          type="checkbox"
                          checked={editRoles.includes(role)}
                          onChange={() => toggleRole(role)}
                          className="accent-primary"
                        />
                        <span className="text-sm">{role}</span>
                      </label>
                    ))}
                  </div>

                  {detail.roles.some(
                    (r) => !ASSIGNABLE_ROLES.includes(r as typeof ASSIGNABLE_ROLES[number]),
                  ) && (
                    <p className="text-xs text-muted-foreground mt-2">
                      This user also has roles not editable here:{' '}
                      {detail.roles
                        .filter((r) => !ASSIGNABLE_ROLES.includes(r as typeof ASSIGNABLE_ROLES[number]))
                        .join(', ')}
                    </p>
                  )}
                </div>

                {saveError && (
                  <p className="text-sm text-error">{saveError}</p>
                )}

                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <Save className="h-3.5 w-3.5 mr-1" />
                    )}
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(false)
                      setEditRoles(detail.roles)
                      setEditFirstName(detail.firstName ?? '')
                      setEditLastName(detail.lastName ?? '')
                      setSaveError(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-sm font-medium text-foreground block mb-2">Roles</span>
                <div className="flex flex-wrap gap-1">
                  {detail.roles.length > 0 ? (
                    detail.roles.map((r) => <TagBadge key={r} label={r} />)
                  ) : (
                    <span className="text-muted-foreground text-sm">No roles assigned</span>
                  )}
                </div>
              </div>
            )}

            {detail.allowedVendors.length > 0 && (
              <div>
                <span className="text-sm font-medium text-foreground block mb-2">
                  Additional Permissions
                </span>
                <div className="rounded-md border border-border-subtle bg-surface-alt p-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Approved vendors ({detail.allowedVendors.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {detail.allowedVendors.map((v) => (
                      <TagBadge key={v.id} label={v.name} variant="muted" />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </AdminModal>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}
