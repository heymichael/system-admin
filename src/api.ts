const BASE = '/agent/api'

export async function agentFetch(
  path: string,
  getIdToken: () => Promise<string>,
  init?: RequestInit,
): Promise<Response> {
  const token = await getIdToken()
  const headers = new Headers(init?.headers)
  headers.set('Authorization', `Bearer ${token}`)
  return fetch(`${BASE}${path}`, { ...init, headers })
}

export interface UserSummary {
  email: string
  firstName: string
  lastName: string
  roles: string[]
}

export interface AllowedVendor {
  id: string
  name: string
}

export interface UserDetail extends UserSummary {
  allowedVendors: AllowedVendor[]
}

export async function fetchUsers(
  getIdToken: () => Promise<string>,
): Promise<UserSummary[]> {
  const res = await agentFetch('/users', getIdToken)
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`)
  return res.json()
}

export async function fetchUserDetail(
  email: string,
  getIdToken: () => Promise<string>,
): Promise<UserDetail> {
  const res = await agentFetch(`/users/${encodeURIComponent(email)}`, getIdToken)
  if (!res.ok) throw new Error(`Failed to fetch user: ${res.status}`)
  return res.json()
}

export async function createUser(
  data: { email: string; firstName: string; lastName: string; roles: string[] },
  getIdToken: () => Promise<string>,
): Promise<UserSummary> {
  const res = await agentFetch('/users', getIdToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `Create failed: ${res.status}`)
  }
  return res.json()
}

export async function updateUser(
  email: string,
  fields: { roles?: string[]; firstName?: string; lastName?: string },
  getIdToken: () => Promise<string>,
): Promise<UserSummary> {
  const res = await agentFetch(`/users/${encodeURIComponent(email)}`, getIdToken, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `Update failed: ${res.status}`)
  }
  return res.json()
}

export async function deleteUser(
  email: string,
  getIdToken: () => Promise<string>,
): Promise<void> {
  const res = await agentFetch(`/users/${encodeURIComponent(email)}`, getIdToken, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `Delete failed: ${res.status}`)
  }
}
