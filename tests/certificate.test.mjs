import test from "node:test";
import assert from "node:assert/strict";
import { SCENARIOS } from "../src/lib/scenarios.js";
import { CERTIFICATE_TIERS, calculateCertificateProgress } from "../src/lib/certificate.js";
import { findCompletedSongGift } from "../src/lib/endingStories.js";

function chatsFor({ counseled, gainPerFriend, songs }) {
  return Object.fromEntries(SCENARIOS.slice(0, counseled).map((scenario, index) => [scenario.id, {
    messages: [{ sender: "victim", text: "힘들어." }, { sender: "user", text: "내가 들어줄게." }],
    turnCount: 1,
    dialogueScore: 25 + gainPerFriend,
    ...(index < songs ? { completedSongGift: { title: `노래 ${index + 1}`, accepted: true } } : {}),
  }]));
}

test("엔딩 완료 전에는 명예상담사 수료증이 발급되지 않는다", () => {
  const progress = calculateCertificateProgress(chatsFor({ counseled: 1, gainPerFriend: 45, songs: 0 }));
  assert.equal(progress.issued, false);
  assert.equal(progress.nextTier, CERTIFICATE_TIERS[0]);
});

test("첫 노래 선물부터 5개 등급의 모든 조건을 함께 충족할 때 승급한다", () => {
  const cases = [
    { counseled: 1, gainPerFriend: 0, songs: 1, level: 1 },
    { counseled: 2, gainPerFriend: 20, songs: 2, level: 2 },
    { counseled: 4, gainPerFriend: 25, songs: 3, level: 3 },
    { counseled: 7, gainPerFriend: 30, songs: 6, level: 4 },
    { counseled: 10, gainPerFriend: 30, songs: 10, level: 5 },
  ];
  for (const item of cases) {
    const progress = calculateCertificateProgress(chatsFor(item));
    assert.equal(progress.tier.level, item.level);
    assert.equal(progress.counseled, item.counseled);
    assert.equal(progress.songs, item.songs);
    assert.equal(progress.stabilityGain, item.counseled * item.gainPerFriend);
  }
  const missingSong = calculateCertificateProgress(chatsFor({ counseled: 10, gainPerFriend: 35, songs: 9 }));
  assert.equal(missingSong.tier.level, 4);
});

test("안정도 점수는 상담으로 얻은 순상승만 합산하고 노래는 친구별로 한 번만 센다", () => {
  const [first, second] = SCENARIOS;
  const chats = {
    [first.id]: {
      messages: [{ sender: "user", text: "내가 들어줄게." }],
      dialogueScore: 40,
      completedSongGift: { title: "노래 선물", accepted: true },
    },
    [second.id]: {
      messages: [{ sender: "user", text: "이야기해 줘." }],
      dialogueScore: 15,
      completedSongGift: { title: "아직 답장이 없는 노래", accepted: false },
    },
  };
  const progress = calculateCertificateProgress(chats);
  assert.deepEqual([progress.counseled, progress.stabilityGain, progress.songs], [2, 15, 1]);
});

test("대화가 80개를 넘어 초기 노래 메시지가 사라져도 완료 기록은 남는다", () => {
  const chat = { messages: [], completedSongGift: { title: "친구를 위한 노래", accepted: true } };
  assert.equal(findCompletedSongGift(chat).title, "친구를 위한 노래");
});
