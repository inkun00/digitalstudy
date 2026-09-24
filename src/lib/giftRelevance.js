import { GIFT_FOCUS_LABELS } from "./fantasyItems.js";

// Only a close match to the friend's concrete harm and immediate needs gives
// a score boost. General kindness can still be gifted without changing score.
const SCENARIO_GIFT_FOCUS = {
  minji: ["belonging", "selfWorth", "rumor", "school", "adult", "evidence", "rest", "expression"],
  junwoo: ["coercion", "threat", "safety", "adult", "fear", "rest"],
  seoyeon: ["privacy", "selfWorth", "evidence", "adult", "fear", "expression"],
  doyoon: ["account", "privacy", "rumor", "evidence", "belonging"],
  haeun: ["rumor", "selfWorth", "evidence", "replyBoundary", "expression"],
  jiho: ["block", "exit", "safety", "fear", "rest", "adult"],
  yeeun: ["selfWorth", "block", "replyBoundary", "expression", "rest"],
  siwoo: ["coercion", "threat", "safety", "adult", "fear"],
  sua: ["privacy", "coercion", "threat", "evidence", "safety", "fear"],
  hyunwoo: ["selfWorth", "belonging", "school", "rumor", "expression"],
};

export function getGiftRelevance(item, scenarioId) {
  const focus = item?.focus;
  const matched = Boolean(focus && SCENARIO_GIFT_FOCUS[scenarioId]?.includes(focus));
  return { matched, focusLabel: GIFT_FOCUS_LABELS[focus] || "마음 돌봄" };
}
