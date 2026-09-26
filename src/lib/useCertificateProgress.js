"use client";

import { useMemo, useSyncExternalStore } from "react";
import { calculateCertificateProgress } from "./certificate.js";
import { CHAT_SESSION_PREFIX, CLOUD_SESSION_EVENT, chatStorageKey } from "./cloudState.js";
import { SCENARIOS } from "./scenarios.js";

function subscribe(onChange) {
  const onStorage = (event) => {
    if (!event.key || event.key.startsWith(CHAT_SESSION_PREFIX)) onChange();
  };
  window.addEventListener(CLOUD_SESSION_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CLOUD_SESSION_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  try { return SCENARIOS.map((scenario) => localStorage.getItem(chatStorageKey(scenario.id)) || "").join("\u001f"); }
  catch { return ""; }
}

export function useCertificateProgress() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => "");
  return useMemo(() => {
    const chats = {};
    snapshot.split("\u001f").forEach((raw, index) => {
      if (!raw || !SCENARIOS[index]) return;
      try { chats[SCENARIOS[index].id] = JSON.parse(raw); }
      catch { /* Skip a damaged local record. */ }
    });
    return calculateCertificateProgress(chats);
  }, [snapshot]);
}
