import { doc, getDoc, getFirestore } from 'firebase/firestore'
import type { FirebaseApp } from 'firebase/app'

export {
  APP_CATALOG,
  APP_GRANTING_ROLES,
  ADMIN_CATALOG,
  ADMIN_GRANTING_ROLES,
  hasAppAccess,
  getAccessibleApps,
  getAccessibleAdminApps,
} from '@haderach/shared-ui'
export type { NavApp as AccessibleApp } from '@haderach/shared-ui'

export const APP_ID = 'system_administration'

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export interface UserDoc {
  roles: string[]
  firstName: string
  lastName: string
}

export async function fetchUserDoc(app: FirebaseApp, email: string): Promise<UserDoc> {
  const empty: UserDoc = { roles: [], firstName: '', lastName: '' }
  try {
    const db = getFirestore(app)
    const snap = await getDoc(doc(db, 'users', normalizeEmail(email)))
    if (!snap.exists()) return empty
    const data = snap.data()
    return {
      roles: Array.isArray(data.roles) ? data.roles : [],
      firstName: typeof data.first_name === 'string' ? data.first_name : '',
      lastName: typeof data.last_name === 'string' ? data.last_name : '',
    }
  } catch {
    return empty
  }
}

export function buildDisplayName(firstName: string, lastName: string): string | undefined {
  const full = [firstName, lastName].filter(Boolean).join(' ')
  return full || undefined
}
