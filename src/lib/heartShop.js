import { useEffect, useSyncExternalStore } from "react";
import { FANTASY_ITEMS } from "./fantasyItems.js";
import { SCENARIOS } from "./scenarios.js";
import { WALLET_DIRTY_KEY } from "./cloudState.js";
import { getGiftRelevance } from "./giftRelevance.js";

export const HEART_WALLET_KEY = "heart_shop_wallet_v1";
const WALLET_EVENT = "heart-wallet-change";
export const MAX_ITEM_BONUS_PER_FRIEND = 40;
export const LYRICS_GENERATION_COST = 100;

export const SHOP_ITEMS = [
  { id: "sunshine", name: "따뜻한 햇살", description: "채팅방을 포근한 노란빛으로", price: 8, icon: "☀️", color: "#fff0a9", background: "linear-gradient(180deg, #fff1b7, #fff9df)" },
  { id: "mint", name: "마음의 숲", description: "차분한 민트빛 채팅방", price: 12, icon: "🌿", color: "#d7f4e8", background: "linear-gradient(180deg, #d4eee5, #ecfaf4)" },
  { id: "peach", name: "복숭아 오후", description: "다정한 코랄빛 채팅방", price: 14, icon: "🍑", color: "#ffe2d4", background: "linear-gradient(180deg, #ffe0d2, #fff1e9)" },
  { id: "lavender", name: "보랏빛 위로", description: "은은한 라벤더빛 채팅방", price: 16, icon: "💜", color: "#ebe1fb", background: "linear-gradient(180deg, #e5dcf4, #f6f0ff)" },
  { id: "cherry", name: "벚꽃 편지", description: "화사한 분홍빛 채팅방", price: 20, icon: "🌸", color: "#ffe2eb", background: "linear-gradient(180deg, #fbdce5, #fff3f6)" },
  { id: "night", name: "별이 뜬 밤", description: "고요한 밤하늘빛 채팅방", price: 24, icon: "✨", color: "#dce4fc", background: "linear-gradient(180deg, #c8d4ec, #e6ecfa)" },
];

function emptyWallet() {
  return { balance: 0, totalEarned: 0, owned: [], equipped: "default", bag: {}, scenarioBoosts: {} };
}

export function parseHeartWallet(raw) {
  try {
    const value = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!value || typeof value !== "object") return emptyWallet();
    const owned = Array.isArray(value.owned) ? [...new Set(value.owned.filter((id) => SHOP_ITEMS.some((item) => item.id === id)))] : [];
    const bag = Object.fromEntries(FANTASY_ITEMS.map((item) => [item.id, value.bag?.[item.id]]).filter(([, count]) => Number.isSafeInteger(count) && count > 0 && count <= 99));
    const scenarioBoosts = Object.fromEntries(SCENARIOS.map((scenario) => [scenario.id, value.scenarioBoosts?.[scenario.id]]).filter(([, amount]) => Number.isSafeInteger(amount) && amount > 0 && amount <= MAX_ITEM_BONUS_PER_FRIEND));
    return {
      balance: Number.isSafeInteger(value.balance) && value.balance >= 0 ? value.balance : 0,
      totalEarned: Number.isSafeInteger(value.totalEarned) && value.totalEarned >= 0 ? value.totalEarned : 0,
      owned,
      equipped: owned.includes(value.equipped) ? value.equipped : "default",
      bag,
      scenarioBoosts,
    };
  } catch {
    return emptyWallet();
  }
}

function getSnapshot() {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(HEART_WALLET_KEY); } catch { return null; }
}

function subscribe(listener) {
  window.addEventListener("storage", listener);
  window.addEventListener(WALLET_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(WALLET_EVENT, listener);
  };
}

export function useHeartWallet() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => null);
  useEffect(() => {
    try { localStorage.removeItem("heart_clova_keys"); } catch { /* Storage may be unavailable. */ }
  }, []);
  return parseHeartWallet(snapshot);
}

function writeWallet(wallet) {
  try {
    localStorage.setItem(HEART_WALLET_KEY, JSON.stringify(wallet));
    localStorage.setItem(WALLET_DIRTY_KEY, "1");
    window.dispatchEvent(new Event(WALLET_EVENT));
    return true;
  } catch { return false; }
}

export function pointsForScoreIncrease(previousScore, nextScore) {
  if (!Number.isFinite(previousScore) || !Number.isFinite(nextScore)) return 0;
  return Math.max(0, Math.round(nextScore) - Math.round(previousScore));
}

export function awardHeartPoints(amount) {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 100) return false;
  const wallet = parseHeartWallet(getSnapshot());
  return writeWallet({ ...wallet, balance: wallet.balance + amount, totalEarned: wallet.totalEarned + amount });
}

export function spendHeartPoints(amount) {
  if (!Number.isSafeInteger(amount) || amount <= 0) return { ok: false, message: "사용할 하트 포인트가 올바르지 않아요." };
  const wallet = parseHeartWallet(getSnapshot());
  if (wallet.balance < amount) return { ok: false, message: `하트 ${amount - wallet.balance}포인트가 더 필요해요.` };
  if (!writeWallet({ ...wallet, balance: wallet.balance - amount })) return { ok: false, message: "하트 사용 내역을 저장하지 못했어요." };
  return { ok: true };
}

export function refundHeartPoints(amount) {
  if (!Number.isSafeInteger(amount) || amount <= 0) return false;
  const wallet = parseHeartWallet(getSnapshot());
  return writeWallet({ ...wallet, balance: wallet.balance + amount });
}

export function purchaseShopItem(itemId) {
  const item = SHOP_ITEMS.find((entry) => entry.id === itemId);
  if (!item) return { ok: false, message: "상품을 찾을 수 없어요." };
  const wallet = parseHeartWallet(getSnapshot());
  if (wallet.owned.includes(itemId)) return { ok: false, message: "이미 보유한 배경이에요." };
  if (wallet.balance < item.price) return { ok: false, message: `${item.price - wallet.balance}포인트가 더 필요해요.` };
  if (!writeWallet({ ...wallet, balance: wallet.balance - item.price, owned: [...wallet.owned, itemId], equipped: itemId })) {
    return { ok: false, message: "구매 내역을 저장하지 못했어요." };
  }
  return { ok: true, message: `${item.name} 배경을 구매하고 적용했어요!` };
}

export function equipShopItem(itemId) {
  const wallet = parseHeartWallet(getSnapshot());
  if (itemId !== "default" && !wallet.owned.includes(itemId)) return false;
  return writeWallet({ ...wallet, equipped: itemId });
}

export function purchaseFantasyItem(itemId) {
  const item = FANTASY_ITEMS.find((entry) => entry.id === itemId);
  if (!item) return { ok: false, message: "아이템을 찾을 수 없어요." };
  const wallet = parseHeartWallet(getSnapshot());
  if (wallet.balance < item.price) return { ok: false, message: `${item.price - wallet.balance}포인트가 더 필요해요.` };
  if ((wallet.bag[itemId] || 0) >= 99) return { ok: false, message: "같은 아이템은 99개까지 보관할 수 있어요." };
  if (!writeWallet({ ...wallet, balance: wallet.balance - item.price, bag: { ...wallet.bag, [itemId]: (wallet.bag[itemId] || 0) + 1 } })) {
    return { ok: false, message: "구매 내역을 저장하지 못했어요." };
  }
  return { ok: true, message: `${item.name}을(를) 가방에 담았어요!` };
}

export function applyFantasyItem(itemId, scenarioId, currentComfort) {
  const item = FANTASY_ITEMS.find((entry) => entry.id === itemId);
  if (!item || !SCENARIOS.some((scenario) => scenario.id === scenarioId)) return { ok: false, message: "아이템이나 친구를 찾을 수 없어요." };
  const wallet = parseHeartWallet(getSnapshot());
  if (!wallet.bag[itemId]) return { ok: false, message: "가방에 없는 아이템이에요." };
  if (!Number.isSafeInteger(currentComfort) || currentComfort < 0 || currentComfort > 100) return { ok: false, message: "현재 안정도를 확인할 수 없어요." };
  const relevance = getGiftRelevance(item, scenarioId);
  const remaining = MAX_ITEM_BONUS_PER_FRIEND - (wallet.scenarioBoosts[scenarioId] || 0);
  const applied = relevance.matched ? Math.min(item.boost, remaining, 100 - currentComfort) : 0;
  const reason = !relevance.matched ? "피해 상황과 선물의 속성이 맞지 않아 안정도는 그대로예요."
    : applied === 0 ? "안정도가 이미 최대치이거나 선물 효과 한도에 도달했어요."
      : `피해 상황과 ${relevance.focusLabel} 속성이 잘 맞아요.`;
  const bag = { ...wallet.bag };
  if (--bag[itemId] === 0) delete bag[itemId];
  const scenarioBoosts = applied > 0
    ? { ...wallet.scenarioBoosts, [scenarioId]: (wallet.scenarioBoosts[scenarioId] || 0) + applied }
    : wallet.scenarioBoosts;
  if (!writeWallet({ ...wallet, bag, scenarioBoosts })) {
    return { ok: false, message: "아이템 사용 내역을 저장하지 못했어요." };
  }
  return { ok: true, applied, item, matched: relevance.matched, reason, message: `${item.name}을(를) 선물했어요. ${reason}${applied > 0 ? ` 안정도 +${applied}` : ""}` };
}
