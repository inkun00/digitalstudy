import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Object.values(config).every(Boolean);
export const AUTH_CHANGED_EVENT = "heart-auth-change";

let anonymousPromise;

export function getFirebaseServices() {
  if (!firebaseConfigured) throw new Error("Firebase 프로젝트 설정이 없습니다.");
  const app = getApps().length ? getApp() : initializeApp(config);
  return { auth: getAuth(app), db: getFirestore(app) };
}

export async function ensureAnonymousUser(auth = getFirebaseServices().auth) {
  if (auth.currentUser) return auth.currentUser;
  if (!anonymousPromise) {
    anonymousPromise = signInAnonymously(auth).then(({ user }) => user).finally(() => {
      anonymousPromise = undefined;
    });
  }
  return anonymousPromise;
}

export async function getFirebaseIdentity() {
  const { auth, db } = getFirebaseServices();
  await auth.authStateReady();
  const user = auth.currentUser || await ensureAnonymousUser(auth);
  return { auth, db, uid: user.uid, user };
}
