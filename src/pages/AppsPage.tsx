import { useCallback, useEffect, useState } from 'react'
import { Button, Input, TagBadge } from '@haderach/shared-ui'
import { useAuthUser } from '@haderach/shared-ui'
import { fetchApps, updateApp } from '../api'
import type { AppDefinition } from '../api'
import { Loader2, Pencil, Save, X } from 'lucide-react'

export function AppsPage() {
  const authUser = useAuthUser()
  const [apps, setApps] = useState<AppDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editRoles, setEditRoles] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const loadApps = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchApps(authUser.getIdToken)
      setApps(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load apps')
    } finally {
      setLoading(false)
    }
  }, [authUser.getIdToken])

  useEffect(() => {
    loadApps()
  }, [loadApps])

  const startEdit = (app: AppDefinition) => {
    setEditingId(app.id)
    setEditLabel(app.label)
    setEditRoles(app.granting_roles.join(', '))
    setSaveError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setSaveError(null)
  }

  const handleSave = useCallback(async () => {
    if (!editingId) return
    setSaving(true)
    setSaveError(null)
    const roles = editRoles.split(',').map((r) => r.trim()).filter(Boolean)
    try {
      const updated = await updateApp(
        editingId,
        { label: editLabel, granting_roles: roles },
        authUser.getIdToken,
      )
      setApps((prev) => prev.map((a) => (a.id === editingId ? updated : a)))
      setEditingId(null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }, [editingId, editLabel, editRoles, authUser.getIdToken])

  const HIDDEN_APPS = new Set(['card', 'stocks'])
  const appTypeApps = apps.filter((a) => a.type === 'app' && !HIDDEN_APPS.has(a.id))
  const adminApps = apps.filter((a) => a.type === 'admin' && !HIDDEN_APPS.has(a.id))

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">App Permissions</h1>
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
        <div className="space-y-8">
          <AppSection
            title="Applications"
            apps={appTypeApps}
            editingId={editingId}
            editLabel={editLabel}
            editRoles={editRoles}
            saving={saving}
            saveError={saveError}
            onEditLabel={setEditLabel}
            onEditRoles={setEditRoles}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
            onSave={handleSave}
          />
          <AppSection
            title="Admin"
            apps={adminApps}
            editingId={editingId}
            editLabel={editLabel}
            editRoles={editRoles}
            saving={saving}
            saveError={saveError}
            onEditLabel={setEditLabel}
            onEditRoles={setEditRoles}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
            onSave={handleSave}
          />
        </div>
      )}
    </>
  )
}

function AppSection({
  title,
  apps,
  editingId,
  editLabel,
  editRoles,
  saving,
  saveError,
  onEditLabel,
  onEditRoles,
  onStartEdit,
  onCancelEdit,
  onSave,
}: {
  title: string
  apps: AppDefinition[]
  editingId: string | null
  editLabel: string
  editRoles: string
  saving: boolean
  saveError: string | null
  onEditLabel: (v: string) => void
  onEditRoles: (v: string) => void
  onStartEdit: (app: AppDefinition) => void
  onCancelEdit: () => void
  onSave: () => void
}) {
  if (apps.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-medium text-foreground mb-3">{title}</h2>
      <div className="rounded-md border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left font-medium px-4 py-3 w-48">App</th>
              <th className="text-left font-medium px-4 py-3">Granting Roles</th>
              <th className="text-right font-medium px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => {
              const isEditing = editingId === app.id
              return (
                <tr key={app.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <Input
                        value={editLabel}
                        onChange={(e) => onEditLabel(e.target.value)}
                        className="h-8 text-sm"
                      />
                    ) : (
                      app.label
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="space-y-1">
                        <Input
                          value={editRoles}
                          onChange={(e) => onEditRoles(e.target.value)}
                          placeholder="role1, role2"
                          className="h-8 text-sm"
                        />
                        {saveError && (
                          <p className="text-xs text-error">{saveError}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {app.granting_roles.map((r) => (
                          <TagBadge key={r} label={r} />
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={onSave}
                          disabled={saving}
                        >
                          {saving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={onCancelEdit}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onStartEdit(app)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
