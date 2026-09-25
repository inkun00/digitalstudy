"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, documentId, getDoc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { SCENARIOS } from "@/lib/scenarios";
import { parseHeartWallet } from "@/lib/heartShop";
import { AUTH_CHANGED_EVENT, ensureAnonymousUser, firebaseConfigured, getFirebaseServices } from "@/lib/firebaseClient";
import { ACTIVE_UID_KEY, CLOUD_SESSION_EVENT, WALLET_DIRTY_KEY, WALLET_STORAGE_KEY, accountCacheBoundary, chatDirtyKey, chatStorageKey, chooseStoredValue } from "@/lib/cloudState";
import { PROFILE_CHANGE_EVENT, clearStoredProfile, getStoredProfile, normalizeUserProfile, storeProfile } from "@/lib/userProfile";

const SESSION_UID_KEY = "heart_cloud_tab_uid";
const CloudSessionContext = createContext({ status: "loading", user: null, profile: null, openingCompleted: false, finishOpening: async () => {} });

export function useCloudSession() {
  return useContext(CloudSessionContext);
}

function readStored(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function readLegacyChat(key) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

function clearAccountCache(uid) {
  const previousUid = readStored(ACTIVE_UID_KEY);
  const previousTabUid = sessionStorage.getItem(SESSION_UID_KEY);
  const boundary = accountCacheBoundary(previousUid, previousTabUid, uid);
  if (boundary.clearLocal) {
    localStorage.removeItem(WALLET_STORAGE_KEY);
    localStorage.removeItem(WALLET_DIRTY_KEY);
    for (const scenario of SCENARIOS) {
      localStorage.removeItem(chatStorageKey(scenario.id));
      localStorage.removeItem(chatDirtyKey(scenario.id));
    }
  }
  if (boundary.clearTab) {
    clearStoredProfile();
    for (const scenario of SCENARIOS) sessionStorage.removeItem(chatStorageKey(scenario.id));
  }
  localStorage.setItem(ACTIVE_UID_KEY, uid);
  sessionStorage.setItem(SESSION_UID_KEY, uid);
}

function parseChat(raw) {
  try {
    const value = JSON.parse(raw);
    if (!value || !Array.isArray(value.messages) || value.messages.length > 80 ||
      value.messages.some((message) => !["user", "victim", "system"].includes(message.sender) || typeof message.text !== "string" || message.text.length > 2000)) return null;
    return {
      messages: value.messages,
      dialogueScore: Number.isFinite(value.dialogueScore) ? value.dialogueScore : 25,
      turnCount: Number.isSafeInteger(value.turnCount) && value.turnCount >= 0 ? value.turnCount : 0,
      coachData: value.coachData && typeof value.coachData === "object" ? value.coachData : null,
    };
  } catch { return null; }
}

export default function CloudSyncProvider({ children }) {
  const [status, setStatus] = useState(firebaseConfigured ? "loading" : "unconfigured");
  const [identity, setIdentity] = useState(null);
  const [profile, setProfile] = useState(null);
  const [openingCompleted, setOpeningCompleted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const currentUid = useRef(null);

  useEffect(() => {
    if (!firebaseConfigured) return;
    const { auth } = getFirebaseServices();
    const syncUser = (user) => {
      if (!user) {
        currentUid.current = null;
        setIdentity(null);
        setStatus("loading");
        ensureAnonymousUser(auth).catch((error) => {
          console.error("[Firebase authentication]", error);
          setStatus("error");
        });
        return;
      }
      if (currentUid.current !== user.uid) setStatus("loading");
      if (currentUid.current !== user.uid) setOpeningCompleted(false);
      currentUid.current = user.uid;
      setIdentity({ uid: user.uid, email: user.email, isAnonymous: user.isAnonymous });
    };
    const unsubscribe = onAuthStateChanged(auth, syncUser, (error) => {
      console.error("[Firebase authentication]", error);
      setStatus("error");
    });
    const onAccountChange = () => syncUser(auth.currentUser);
    window.addEventListener(AUTH_CHANGED_EVENT, onAccountChange);
    return () => {
      unsubscribe();
      window.removeEventListener(AUTH_CHANGED_EVENT, onAccountChange);
    };
  }, []);

  useEffect(() => {
    const onProfileChange = () => setProfile(getStoredProfile());
    window.addEventListener(PROFILE_CHANGE_EVENT, onProfileChange);
    return () => window.removeEventListener(PROFILE_CHANGE_EVENT, onProfileChange);
  }, []);

  useEffect(() => {
    if (!identity?.uid) return;
    let cancelled = false;
    let writeQueue = Promise.resolve();
    const { auth, db } = getFirebaseServices();
    const walletRef = doc(db, "users", identity.uid, "state", "wallet");
    const profileRef = doc(db, "users", identity.uid, "state", "profile");
    const chatsRef = collection(db, "users", identity.uid, "chats");

    const enqueue = (work) => {
      writeQueue = writeQueue.then(work).catch((error) => {
        console.error("[Firebase sync]", error);
        if (!cancelled) setStatus("error");
      });
    };

    const uploadWallet = () => {
      const raw = readStored(WALLET_STORAGE_KEY);
      if (!raw) return;
      enqueue(async () => {
        await setDoc(walletRef, { wallet: parseHeartWallet(raw), updatedAt: serverTimestamp() });
        if (readStored(WALLET_STORAGE_KEY) === raw) localStorage.removeItem(WALLET_DIRTY_KEY);
        if (!cancelled) setStatus("ready");
      });
    };

    const uploadChat = (scenarioId) => {
      const key = chatStorageKey(scenarioId);
      const raw = readStored(key);
      const chat = parseChat(raw);
      if (!chat) return;
      enqueue(async () => {
        await setDoc(doc(chatsRef, scenarioId), { ...chat, updatedAt: serverTimestamp() });
        if (JSON.stringify(parseChat(readStored(key))) === JSON.stringify(chat)) localStorage.removeItem(chatDirtyKey(scenarioId));
        if (!cancelled) setStatus("ready");
      });
    };

    const onWalletChange = () => uploadWallet();
    const onChatChange = (event) => {
      const id = event.detail?.scenarioId;
      if (SCENARIOS.some((scenario) => scenario.id === id)) uploadChat(id);
    };
    const onOnline = () => {
      if (readStored(WALLET_DIRTY_KEY)) uploadWallet();
      for (const scenario of SCENARIOS) if (readStored(chatDirtyKey(scenario.id))) uploadChat(scenario.id);
    };

    async function start() {
      try {
        clearAccountCache(identity.uid);
        const [walletSnapshot, chatSnapshots, profileSnapshot] = await Promise.all([
          getDoc(walletRef), getDocs(query(chatsRef, where(documentId(), "in", SCENARIOS.map((scenario) => scenario.id)))), getDoc(profileRef),
        ]);
        if (cancelled) return;

        const savedProfile = profileSnapshot.exists() ? normalizeUserProfile(profileSnapshot.data()) : null;
        setOpeningCompleted(profileSnapshot.exists() && profileSnapshot.data().openingCompleted === true);
        if (savedProfile) storeProfile(savedProfile);
        else if (!auth.currentUser?.isAnonymous) clearStoredProfile();
        setProfile(getStoredProfile());

        const localWallet = readStored(WALLET_STORAGE_KEY);
        const cloudWallet = walletSnapshot.exists() ? JSON.stringify(parseHeartWallet(walletSnapshot.data().wallet)) : null;
        const walletChoice = chooseStoredValue(localWallet, cloudWallet, Boolean(readStored(WALLET_DIRTY_KEY)));
        if (walletChoice.value !== null) {
          localStorage.setItem(WALLET_STORAGE_KEY, walletChoice.value);
          window.dispatchEvent(new Event("heart-wallet-change"));
        }
        if (walletChoice.needsUpload) {
          localStorage.setItem(WALLET_DIRTY_KEY, "1");
          uploadWallet();
        }

        const cloudChats = new Map(chatSnapshots.docs.map((snapshot) => [snapshot.id, snapshot.data()]));
        for (const scenario of SCENARIOS) {
          const key = chatStorageKey(scenario.id);
          const localChat = readStored(key) || readLegacyChat(key);
          const remoteChat = cloudChats.has(scenario.id) ? JSON.stringify(cloudChats.get(scenario.id)) : null;
          const choice = chooseStoredValue(localChat, remoteChat, Boolean(readStored(chatDirtyKey(scenario.id))));
          if (choice.value !== null && parseChat(choice.value)) localStorage.setItem(key, choice.value);
          if (choice.needsUpload && parseChat(choice.value)) {
            localStorage.setItem(chatDirtyKey(scenario.id), "1");
            uploadChat(scenario.id);
          }
        }

        window.addEventListener("heart-wallet-change", onWalletChange);
        window.addEventListener(CLOUD_SESSION_EVENT, onChatChange);
        window.addEventListener("online", onOnline);
        setStatus("ready");
      } catch (error) {
        console.error("[Firebase initialization]", error);
        if (!cancelled) setStatus("error");
      }
    }
    start();
    return () => {
      cancelled = true;
      window.removeEventListener("heart-wallet-change", onWalletChange);
      window.removeEventListener(CLOUD_SESSION_EVENT, onChatChange);
      window.removeEventListener("online", onOnline);
    };
  }, [identity?.uid, retryCount]);

  const finishOpening = async () => {
    if (!identity?.uid || identity.isAnonymous) throw new Error("로그인이 필요해요.");
    const { db } = getFirebaseServices();
    await setDoc(doc(db, "users", identity.uid, "state", "profile"), {
      openingCompleted: true,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    setOpeningCompleted(true);
  };

  const session = { status, user: identity, profile, openingCompleted, finishOpening };
  if (status === "loading") return <CloudSessionContext.Provider value={session}><main className="cloud-loading" role="status">저장된 대화와 하트를 불러오는 중이에요…</main></CloudSessionContext.Provider>;
  return <CloudSessionContext.Provider value={session}>
    {status === "unconfigured" && <p className="cloud-status" role="status">Firebase 연결 전입니다. 현재 기록은 이 브라우저에만 저장돼요.</p>}
    {status === "error" && <p className="cloud-status cloud-status-error" role="alert">클라우드 저장에 연결하지 못했어요. 기록은 이 브라우저에 보관돼요. <button type="button" onClick={() => { setStatus("loading"); setRetryCount((count) => count + 1); }}>다시 연결</button></p>}
    {children}
  </CloudSessionContext.Provider>;
}
