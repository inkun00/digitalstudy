import { INITIAL_COMFORT, clampScore } from "./evaluation.js";
import { findCompletedSongGift } from "./endingStories.js";
import { SCENARIOS } from "./scenarios.js";

export const CERTIFICATE_TIERS = [
  { level: 1, name: "마음의 첫걸음", badge: "BRONZE", counseled: 1, stabilityGain: 0, songs: 1 },
  { level: 2, name: "따뜻한 경청자", badge: "SILVER", counseled: 2, stabilityGain: 40, songs: 2 },
  { level: 3, name: "믿음의 동행자", badge: "SAPPHIRE", counseled: 4, stabilityGain: 100, songs: 3 },
  { level: 4, name: "희망의 상담사", badge: "GOLD", counseled: 7, stabilityGain: 200, songs: 6 },
  { level: 5, name: "빛나는 명예상담사", badge: "CROWN", counseled: 10, stabilityGain: 300, songs: 10 },
];

export function calculateCertificateProgress(chats = {}) {
  let counseled = 0;
  let stabilityGain = 0;
  let songs = 0;

  for (const scenario of SCENARIOS) {
    const chat = chats[scenario.id];
    if (!chat || !Array.isArray(chat.messages)) continue;
    const hasCounseling = chat.messages.some((message) => message?.sender === "user") ||
      (Number.isSafeInteger(chat.turnCount) && chat.turnCount > 0);
    if (hasCounseling) {
      counseled += 1;
      if (Number.isFinite(chat.dialogueScore)) {
        stabilityGain += Math.max(0, clampScore(chat.dialogueScore) - INITIAL_COMFORT);
      }
    }
    if (findCompletedSongGift(chat)) songs += 1;
  }

  const tier = [...CERTIFICATE_TIERS].reverse().find((candidate) =>
    counseled >= candidate.counseled && stabilityGain >= candidate.stabilityGain && songs >= candidate.songs) || null;
  const nextTier = tier ? CERTIFICATE_TIERS[tier.level] || null : CERTIFICATE_TIERS[0];

  return { counseled, stabilityGain, songs, tier, nextTier, issued: Boolean(tier) };
}
