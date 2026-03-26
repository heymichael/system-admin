export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
  storageBucket?: string
  messagingSenderId?: string
  measurementId?: string
}

interface AuthRuntimeConfigResult {
  bypassAuth: boolean
  firebaseConfig: FirebaseWebConfig | null
  configError: string | null
}

const REQUIRED_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const

function bypassEnabledFromQuery(): boolean {
  const params = new URLSearchParams(window.location.search)
  return params.get('authBypass') === '1'
}

export function getAuthRuntimeConfig(): AuthRuntimeConfigResult {
  const bypassAuth = import.meta.env.VITE_AUTH_BYPASS === 'true' || bypassEnabledFromQuery()
  if (bypassAuth) {
    return { bypassAuth: true, firebaseConfig: null, configError: null }
  }

  const missingVars = REQUIRED_VARS.filter((key) => !String(import.meta.env[key] || '').trim())
  if (missingVars.length > 0) {
    return {
      bypassAuth: false,
      firebaseConfig: null,
      configError: `Missing required auth environment variables: ${missingVars.join(', ')}`,
    }
  }

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string
  const appId = import.meta.env.VITE_FIREBASE_APP_ID as string

  return {
    bypassAuth: false,
    configError: null,
    firebaseConfig: {
      apiKey,
      authDomain,
      projectId,
      appId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    },
  }
}
