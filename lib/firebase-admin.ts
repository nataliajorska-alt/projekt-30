/**
 * Firebase Admin SDK — singleton init dla server-side route handlerów.
 *
 * Wymaga env vars:
 *   FIREBASE_ADMIN_PROJECT_ID
 *   FIREBASE_ADMIN_CLIENT_EMAIL
 *   FIREBASE_ADMIN_PRIVATE_KEY  (z literałami \n zachowanymi z JSON service account)
 *
 * Service account JSON pobierasz z Firebase Console:
 *   Project Settings → Service accounts → Generate new private key
 */

import { getApps, initializeApp, cert, type App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

let appInstance: App | null = null

export function getAdmin(): { app: App; db: Firestore } {
  if (!appInstance) {
    const existing = getApps()
    if (existing.length > 0) {
      appInstance = existing[0]!
    } else {
      const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
      const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
      const privateKeyRaw = process.env.FIREBASE_ADMIN_PRIVATE_KEY
      if (!projectId || !clientEmail || !privateKeyRaw) {
        throw new Error(
          'firebase-admin: missing one of FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY env vars',
        )
      }
      // Vercel storuje \n jako literalne backslash-n — zamieniam na realny newline.
      const privateKey = privateKeyRaw.replace(/\\n/g, '\n')
      appInstance = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      })
    }
  }
  return { app: appInstance, db: getFirestore(appInstance) }
}
