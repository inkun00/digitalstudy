import { EmailAuthProvider, linkWithCredential, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, serverTimestamp, setDoc, waitForPendingWrites } from "firebase/firestore";
import { AUTH_CHANGED_EVENT, getFirebaseIdentity, getFirebaseServices } from "./firebaseClient.js";
import { clearStoredProfile, normalizeUserProfile, storeProfile } from "./userProfile.js";

export function accountErrorMessage(error) {
  switch (error?.code) {
    case "auth/email-already-in-use":
    case "auth/credential-already-in-use": return "이미 가입된 이메일이에요. 로그인해 주세요.";
    case "auth/invalid-email": return "이메일 주소를 확인해 주세요.";
    case "auth/weak-password": return "더 긴 비밀번호를 입력해 주세요.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password": return "이메일 또는 비밀번호가 맞지 않아요.";
    case "auth/too-many-requests": return "로그인 시도가 많아요. 잠시 후 다시 시도해 주세요.";
    case "auth/network-request-failed": return "네트워크에 연결할 수 없어요. 잠시 후 다시 시도해 주세요.";
    default: return error?.message || "요청을 처리하지 못했어요. 다시 시도해 주세요.";
  }
}

export async function registerAccount(email, password, profile) {
  const normalized = normalizeUserProfile(profile);
  if (!normalized) throw new Error("이름, 성별, 나이를 확인해 주세요.");
  const { auth, db, user } = await getFirebaseIdentity();
  if (!user.isAnonymous) throw new Error("이미 로그인한 계정이 있어요.");
  const credential = EmailAuthProvider.credential(email.trim(), password);
  await linkWithCredential(user, credential);
  clearStoredProfile();
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  await setDoc(doc(db, "users", auth.currentUser.uid, "state", "profile"), {
    ...normalized,
    openingCompleted: false,
    updatedAt: serverTimestamp(),
  });
  storeProfile(normalized);
  return auth.currentUser;
}

export async function loginAccount(email, password) {
  const { auth, db } = getFirebaseServices();
  await waitForPendingWrites(db);
  const user = (await signInWithEmailAndPassword(auth, email.trim(), password)).user;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  return user;
}

export async function saveAccountProfile(profile) {
  const normalized = normalizeUserProfile(profile);
  if (!normalized) throw new Error("이름, 성별, 나이를 확인해 주세요.");
  const { auth, db } = getFirebaseServices();
  if (!auth.currentUser || auth.currentUser.isAnonymous) throw new Error("로그인한 뒤 프로필을 저장해 주세요.");
  await setDoc(doc(db, "users", auth.currentUser.uid, "state", "profile"), {
    ...normalized,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  storeProfile(normalized);
  return normalized;
}

export async function logoutAccount() {
  const { auth, db } = getFirebaseServices();
  await waitForPendingWrites(db);
  await signOut(auth);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
