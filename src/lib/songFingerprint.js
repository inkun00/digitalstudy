import { SCENARIOS } from "./scenarios.js";

export const SONG_FINGERPRINT_PATTERN = /^[a-f0-9]{64}$/;

async function hashBytes(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function normalizeSongLyrics(lyrics) {
  if (typeof lyrics !== "string") return "";
  return lyrics.normalize("NFKC")
    .replace(/(?:^|\n)\s*(?:\d+\s*마디|[1-4]\s*절)\s*[:：.\-]?\s*/g, "")
    .toLocaleLowerCase("ko")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export async function getSongFingerprint(lyrics) {
  const normalized = normalizeSongLyrics(lyrics);
  if (!normalized) return null;
  return hashBytes(new TextEncoder().encode(normalized));
}

export async function getPdfContentFingerprint(file) {
  return hashBytes(await file.arrayBuffer());
}

export async function collectOtherVictimSongFingerprints(chats, currentScenarioId) {
  const fingerprints = new Set();
  for (const scenario of SCENARIOS) {
    if (scenario.id === currentScenarioId) continue;
    const chat = chats[scenario.id];
    if (!chat) continue;
    for (const value of Array.isArray(chat.songFingerprints) ? chat.songFingerprints : []) {
      if (SONG_FINGERPRINT_PATTERN.test(value)) fingerprints.add(value);
    }
    for (const message of Array.isArray(chat.messages) ? chat.messages : []) {
      const gift = message?.sender === "system" ? message.songGift : null;
      if (!gift) continue;
      if (SONG_FINGERPRINT_PATTERN.test(gift.fingerprint || "")) fingerprints.add(gift.fingerprint);
      else if (gift.lyrics) {
        const fingerprint = await getSongFingerprint(gift.lyrics);
        if (fingerprint) fingerprints.add(fingerprint);
      }
    }
  }
  return [...fingerprints];
}

export function collectOtherVictimPdfFingerprints(chats, currentScenarioId) {
  const fingerprints = new Set();
  for (const scenario of SCENARIOS) {
    if (scenario.id === currentScenarioId) continue;
    const chat = chats[scenario.id];
    if (!chat) continue;
    for (const value of Array.isArray(chat.songFileFingerprints) ? chat.songFileFingerprints : []) {
      if (SONG_FINGERPRINT_PATTERN.test(value)) fingerprints.add(value);
    }
    for (const message of Array.isArray(chat.messages) ? chat.messages : []) {
      const fingerprint = message?.sender === "system" ? message.songGift?.fileFingerprint : null;
      if (typeof fingerprint === "string" && SONG_FINGERPRINT_PATTERN.test(fingerprint)) fingerprints.add(fingerprint);
    }
  }
  return [...fingerprints];
}
