import assert from "node:assert/strict";
import test from "node:test";
import { SCENARIOS } from "../src/lib/scenarios.js";
import { canReceiveSongGift, SONG_GIFT_REFUSAL } from "../src/lib/songGiftConfig.js";
import { buildSongScoreMessages, generateSongGiftReply, parseSongScore } from "../src/lib/songGift.js";

test("노래 선물은 안정도 70점부터 가능하다", () => {
  assert.equal(canReceiveSongGift(69), false);
  assert.equal(canReceiveSongGift(70), true);
  assert.equal(canReceiveSongGift(100), true);
  assert.equal(canReceiveSongGift(101), false);
  assert.equal(SONG_GIFT_REFUSAL, "아직은 노래를 듣고 싶지 않아.");
});

test("악보 이미지는 HCX-005에서 받는 데이터 URI 형식으로 보낸다", () => {
  const messages = buildSongScoreMessages(["abc", "def"]);
  assert.equal(messages[1].content[0].dataUri.data, "data:image/jpeg;base64,abc");
  assert.equal(messages[2].content[0].dataUri.data, "data:image/jpeg;base64,def");
  assert.match(messages[2].content[1].text, /전체 페이지/);
});

test("악보의 제목, 편지, 가사를 분리하고 글자가 없는 PDF는 거절한다", () => {
  assert.deepEqual(parseSongScore("<제목>\n희망의 노래\n<편지>\n네 이야기를 들었어\n<가사>\n함께 걸어가자"), {
    title: "희망의 노래", letter: "네 이야기를 들었어", lyrics: "함께 걸어가자",
  });
  assert.throws(() => parseSongScore("<제목>제목<편지><가사>"), { status: 422 });
});

test("전사한 편지와 가사를 상담 대화와 함께 피해자 답장 생성에 사용한다", async () => {
  const calls = [];
  const responses = [
    "<제목>\n희망의 노래\n<편지>\n혼자가 아니야\n<가사>\n내가 곁에 있을게",
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
  assert.equal(calls.length, 2);
  assert.match(calls[1].messages[1].content, /혼자가 아니야/);
  assert.match(calls[1].messages[1].content, /단톡방에서 놀림받았어/);
  assert.equal(song.title, "희망의 노래");
  assert.match(song.reply, /고마워/);
});
