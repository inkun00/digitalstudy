import assert from "node:assert/strict";
import { statSync } from "node:fs";
import test from "node:test";
import { SCENARIOS } from "../src/lib/scenarios.js";
import { ENDING_STORIES, findCompletedSongGift } from "../src/lib/endingStories.js";
import { buildClovaMessages } from "../src/lib/clovaChat.js";
import { canReceiveSongGift, SONG_GIFT_REFUSAL } from "../src/lib/songGiftConfig.js";
import { buildSongScoreMessages, generateSongGiftReply, parseSongScore, parseSongSuitability } from "../src/lib/songGift.js";

test("노래 선물은 안정도 70점부터 가능하다", () => {
  assert.equal(canReceiveSongGift(69), false);
  assert.equal(canReceiveSongGift(70), true);
  assert.equal(canReceiveSongGift(100), true);
  assert.equal(canReceiveSongGift(101), false);
  assert.equal(SONG_GIFT_REFUSAL, "아직은 노래를 듣고 싶지 않아.");
});

test("악보 이미지는 HCX-005에서 받는 데이터 URI 형식으로 보낸다", () => {
  const messages = buildSongScoreMessages(["abc"]);
  assert.equal(messages[1].content[0].dataUri.data, "data:image/jpeg;base64,abc");
  assert.match(messages[1].content[1].text, /표준 양식/);
});

test("표준 양식만 받아들이고 악보의 제목, 편지, 가사를 분리한다", () => {
  assert.deepEqual(parseSongScore("<양식>적합</양식><제목>\n희망의 노래</제목>\n<편지>\n네 이야기를 들었어</편지>\n<가사>\n함께 걸어가자</가사>"), {
    title: "희망의 노래", letter: "네 이야기를 들었어", lyrics: "함께 걸어가자",
  });
  assert.throws(() => parseSongScore("<양식>부적합</양식>"), { code: "INVALID_SONG_FORMAT", status: 422 });
  assert.throws(() => parseSongScore("<양식>적합</양식><제목>제목<편지><가사>"), { status: 422 });
});

test("위로·예방·대처 가사만 반응한다", () => {
  assert.equal(parseSongSuitability("<결과>적합</결과>"), true);
  assert.equal(parseSongSuitability("적합"), true);
  assert.equal(parseSongSuitability("<결과>부적합</결과>"), false);
  assert.equal(parseSongSuitability("적합한 것 같아요"), false);
});

test("적합한 가사는 편지·대화와 함께 피해자 답장 생성에 사용한다", async () => {
  const calls = [];
  const responses = [
    "<양식>적합</양식><제목>\n희망의 노래\n<편지>\n혼자가 아니야\n<가사>\n내가 곁에 있을게",
    "<결과>적합</결과>",
    "'내가 곁에 있을게'라는 가사가 마음에 남아. 직접 만든 노래 악보를 줘서 고마워.",
  ];
  const fetchImpl = async (_url, options) => {
    calls.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ result: { message: { content: responses.shift() } } }) };
  };
  const song = await generateSongGiftReply({
    scenario: SCENARIOS[0],
    messages: [{ sender: "victim", text: "단톡방에서 놀림받았어" }, { sender: "user", text: "네 곁에 있을게" }],
    counselor: { name: "학생", age: 12, gender: "undisclosed" },
    pages: ["abc"], apiKey: "test-key", fetchImpl,
  });
  assert.equal(calls.length, 3);
  assert.doesNotMatch(calls[1].messages[1].content, /혼자가 아니야/);
  assert.match(calls[1].messages[1].content, /내가 곁에 있을게/);
  assert.match(calls[2].messages[1].content, /혼자가 아니야/);
  assert.match(calls[2].messages[1].content, /단톡방에서 놀림받았어/);
  assert.equal(song.title, "희망의 노래");
  assert.equal(song.suitable, true);
  assert.match(song.reply, /고마워/);
});

test("주제와 무관한 가사는 피해자 답장을 요청하지 않는다", async () => {
  const responses = ["<양식>적합</양식><제목>지구의 노래<편지>환경을 지켜요<가사>스위치를 끄고 전기를 아껴요", "<결과>부적합</결과>"];
  let calls = 0;
  const song = await generateSongGiftReply({
    scenario: SCENARIOS[0], messages: [], counselor: { name: "학생", age: 12, gender: "undisclosed" }, pages: ["abc"], apiKey: "test-key",
    fetchImpl: async () => { calls += 1; return { ok: true, json: async () => ({ result: { message: { content: responses.shift() } } }) }; },
  });
  assert.equal(calls, 2);
  assert.equal(song.suitable, false);
  assert.equal(song.reply, null);
});

test("관련 없는 노래 선물은 이후 피해자 대화의 맥락에도 넣지 않는다", () => {
  const prompt = buildClovaMessages({
    scenario: SCENARIOS[0], counselor: { name: "학생", age: 12, gender: "undisclosed" },
    messages: [
      { sender: "system", text: "노래 선물", songGift: { title: "지구의 노래", lyrics: "전기 절약", suitable: false } },
      { sender: "user", text: "오늘은 좀 어때?" },
    ],
  });
  assert.doesNotMatch(JSON.stringify(prompt), /지구의 노래/);
});

test("엔딩은 감사 답장이 있는 적합한 노래 선물에서만 열린다", () => {
  const gift = { sender: "system", songGift: { suitable: true, title: "희망의 노래" } };
  assert.equal(findCompletedSongGift({ messages: [gift, { sender: "victim", text: "고마워" }] }).title, "희망의 노래");
  assert.equal(findCompletedSongGift({ messages: [gift] }), null);
  assert.equal(findCompletedSongGift({ messages: [{ sender: "system", songGift: { suitable: false } }, { sender: "victim", text: "고마워" }] }), null);
});

test("10명 모두 각자의 엔딩 이야기와 생성된 장면 파일이 있다", () => {
  assert.equal(Object.keys(ENDING_STORIES).length, SCENARIOS.length);
  for (const scenario of SCENARIOS) {
    const ending = ENDING_STORIES[scenario.id];
    assert.ok(ending?.title && ending.story && ending.step && ending.scene);
    const file = new URL(`../public${ending.image}`, import.meta.url);
    assert.ok(statSync(file).size > 30_000);
  }
});
