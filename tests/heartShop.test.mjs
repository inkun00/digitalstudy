import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { HEART_WALLET_KEY, LYRICS_GENERATION_COST, applyFantasyItem, awardHeartPoints, equipShopItem, parseHeartWallet, pointsForScoreIncrease, purchaseFantasyItem, purchaseShopItem, refundHeartPoints, spendHeartPoints } from "../src/lib/heartShop.js";
import { FANTASY_ITEMS, GIFT_FOCUS_LABELS } from "../src/lib/fantasyItems.js";
import { getGiftRelevance } from "../src/lib/giftRelevance.js";
import { SCENARIOS } from "../src/lib/scenarios.js";

test("실제 마음 안정도가 오른 만큼만 하트를 적립한다", () => {
  assert.equal(pointsForScoreIncrease(25, 37), 12);
  assert.equal(pointsForScoreIncrease(95, 100), 5);
  assert.equal(pointsForScoreIncrease(40, 32), 0);
  assert.equal(pointsForScoreIncrease(40, 40), 0);
});

test("가사 생성비 100포인트는 잔액이 충분할 때만 차감하고 실패 시 복구한다", () => {
  const oldWindow = globalThis.window;
  const oldStorage = globalThis.localStorage;
  const values = new Map();
  globalThis.window = new EventTarget();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  try {
    values.set(HEART_WALLET_KEY, JSON.stringify({ balance: 99, totalEarned: 99 }));
    assert.equal(spendHeartPoints(LYRICS_GENERATION_COST).ok, false);
    assert.equal(parseHeartWallet(values.get(HEART_WALLET_KEY)).balance, 99);
    values.set(HEART_WALLET_KEY, JSON.stringify({ balance: 120, totalEarned: 120 }));
    assert.equal(spendHeartPoints(LYRICS_GENERATION_COST).ok, true);
    assert.equal(parseHeartWallet(values.get(HEART_WALLET_KEY)).balance, 20);
    assert.equal(refundHeartPoints(LYRICS_GENERATION_COST), true);
    const wallet = parseHeartWallet(values.get(HEART_WALLET_KEY));
    assert.equal(wallet.balance, 120);
    assert.equal(wallet.totalEarned, 120);
  } finally {
    globalThis.window = oldWindow;
    globalThis.localStorage = oldStorage;
  }
});

test("판타지 아이템 100종은 이름·소개·효과·이미지 경로가 각각 있다", () => {
  assert.equal(FANTASY_ITEMS.length, 100);
  assert.equal(new Set(FANTASY_ITEMS.map((item) => item.name)).size, 100);
  for (const item of FANTASY_ITEMS) {
    assert.ok(item.description.length > 10);
    assert.ok(item.effect.length > 10);
    assert.match(item.image, /^\/items\/fantasy-\d{3}\.webp$/);
    assert.ok(item.boost >= 10, `${item.name}의 기본 안정도는 10 이상이어야 해요.`);
    assert.ok(GIFT_FOCUS_LABELS[item.focus]);
    assert.ok(SCENARIOS.some((scenario) => getGiftRelevance(item, scenario.id).matched), `${item.name}은 연결되는 피해 상황이 없어요.`);
  }
});

test("같은 선물도 피해 유형과 맞을 때만 안정도를 높이고, 맞지 않아도 전달된다", () => {
  const oldWindow = globalThis.window;
  const oldStorage = globalThis.localStorage;
  const values = new Map();
  const item = FANTASY_ITEMS.find((entry) => entry.id === "fantasy-028"); // 계정 사칭 확인
  globalThis.window = new EventTarget();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  try {
    assert.equal(getGiftRelevance(item, "doyoon").matched, true);
    assert.equal(getGiftRelevance(item, "minji").matched, false);
    values.set(HEART_WALLET_KEY, JSON.stringify({ balance: 0, totalEarned: 0, bag: { [item.id]: 2 } }));
    const unrelated = applyFantasyItem(item.id, "minji", 25);
    assert.equal(unrelated.ok, true);
    assert.equal(unrelated.applied, 0);
    assert.equal(unrelated.matched, false);
    let wallet = parseHeartWallet(values.get(HEART_WALLET_KEY));
    assert.equal(wallet.bag[item.id], 1);
    assert.equal(wallet.scenarioBoosts.minji, undefined);

    const relevant = applyFantasyItem(item.id, "doyoon", 25);
    assert.equal(relevant.ok, true);
    assert.equal(relevant.applied, item.boost);
    wallet = parseHeartWallet(values.get(HEART_WALLET_KEY));
    assert.equal(wallet.bag[item.id], undefined);
    assert.equal(wallet.scenarioBoosts.doyoon, item.boost);
    assert.equal(wallet.totalEarned, 0);
  } finally {
    globalThis.window = oldWindow;
    globalThis.localStorage = oldStorage;
  }
});

test("안정도가 이미 최대여도 선물은 전달되고 추가 점수는 생기지 않는다", () => {
  const oldWindow = globalThis.window;
  const oldStorage = globalThis.localStorage;
  const values = new Map();
  const item = FANTASY_ITEMS[0];
  globalThis.window = new EventTarget();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  try {
    values.set(HEART_WALLET_KEY, JSON.stringify({ bag: { [item.id]: 1 }, scenarioBoosts: { minji: 40 } }));
    const result = applyFantasyItem(item.id, "minji", 100);
    assert.equal(result.ok, true);
    assert.equal(result.matched, true);
    assert.equal(result.applied, 0);
    const wallet = parseHeartWallet(values.get(HEART_WALLET_KEY));
    assert.equal(wallet.bag[item.id], undefined);
    assert.equal(wallet.scenarioBoosts.minji, 40);
  } finally {
    globalThis.window = oldWindow;
    globalThis.localStorage = oldStorage;
  }
});

test("100종의 아이템 그림은 모두 별도의 WebP 파일이다", () => {
  const hashes = FANTASY_ITEMS.map((item) => {
    const bytes = readFileSync(new URL(`../public${item.image}`, import.meta.url));
    assert.ok(bytes.length > 5_000, `${item.name} 이미지가 비어 있어요.`);
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
    return createHash("sha256").update(bytes).digest("hex");
  });
  assert.equal(new Set(hashes).size, 100);
});

test("모든 피해자 프로필과 시작 화면 그림이 WebP로 제공된다", () => {
  for (const scenario of SCENARIOS) {
    assert.match(scenario.avatar, /^\/avatars\/[a-z]+-v2\.webp$/);
    const bytes = readFileSync(new URL(`../public${scenario.avatar}`, import.meta.url));
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  }
  const hero = readFileSync(new URL("../public/hero/counseling-children.webp", import.meta.url));
  assert.equal(hero.toString("ascii", 0, 4), "RIFF");
  assert.equal(hero.toString("ascii", 8, 12), "WEBP");
});

test("하트로 배경을 구매하고 보유한 배경만 적용할 수 있다", () => {
  const oldWindow = globalThis.window;
  const oldStorage = globalThis.localStorage;
  const values = new Map();
  globalThis.window = new EventTarget();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  try {
    assert.equal(purchaseShopItem("sunshine").ok, false);
    assert.equal(awardHeartPoints(12), true);
    assert.equal(purchaseShopItem("sunshine").ok, true);
    const wallet = parseHeartWallet(values.get(HEART_WALLET_KEY));
    assert.equal(wallet.balance, 4);
    assert.equal(wallet.totalEarned, 12);
    assert.deepEqual(wallet.owned, ["sunshine"]);
    assert.equal(wallet.equipped, "sunshine");
    assert.equal(purchaseShopItem("sunshine").ok, false);
    assert.equal(equipShopItem("mint"), false);
    assert.equal(equipShopItem("default"), true);
  } finally {
    globalThis.window = oldWindow;
    globalThis.localStorage = oldStorage;
  }
});

test("마법 아이템 구매와 사용은 포인트를 보상하지 않고 친구별 효과 한도를 지킨다", () => {
  const oldWindow = globalThis.window;
  const oldStorage = globalThis.localStorage;
  const values = new Map();
  globalThis.window = new EventTarget();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  try {
    const item = FANTASY_ITEMS[0];
    assert.equal(purchaseFantasyItem(item.id).ok, false);
    assert.equal(awardHeartPoints(20), true);
    assert.equal(purchaseFantasyItem(item.id).ok, true);
    const beforeUse = parseHeartWallet(values.get(HEART_WALLET_KEY));
    assert.equal(beforeUse.bag[item.id], 1);
    const result = applyFantasyItem(item.id, "minji", 25);
    assert.equal(result.ok, true);
    assert.equal(result.applied, item.boost);
    const afterUse = parseHeartWallet(values.get(HEART_WALLET_KEY));
    assert.equal(afterUse.bag[item.id], undefined);
    assert.equal(afterUse.scenarioBoosts.minji, item.boost);
    assert.equal(afterUse.totalEarned, 20);
    assert.equal(afterUse.balance, 20 - item.price);
    assert.equal(applyFantasyItem(item.id, "minji", 25).ok, false);
  } finally {
    globalThis.window = oldWindow;
    globalThis.localStorage = oldStorage;
  }
});
