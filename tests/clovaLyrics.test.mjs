import test from "node:test";
import assert from "node:assert/strict";
import { SCENARIOS } from "../src/lib/scenarios.js";
import { buildLyricsMessages, generateClovaLyrics, lyricCharacterCount, parseLyrics } from "../src/lib/clovaLyrics.js";

const scenario = SCENARIOS[0];
const messages = [
  { sender: "victim", text: "단톡방에서 나를 비웃는 글을 봐서 학교 가기 무서워." },
  { sender: "user", text: "네 잘못이 아니야. 내가 들어줄게." },
  { sender: "victim", text: "선생님께 말하면 더 놀림받을까 봐 걱정돼." },
  { sender: "user", text: "캡처해 두고 믿을 만한 어른과 함께 이야기해 보자." },
];

test("노랫말 생성 요청에 피해 상황과 실제 대화 내용을 담는다", () => {
  const prompt = buildLyricsMessages(scenario, messages);
  assert.match(prompt[0].content, /4줄 × 4마디, 총 16마디/);
  assert.match(prompt[0].content, /2~6글자/);
  assert.match(prompt[1].content, /학교 가기 무서워/);
  assert.match(prompt[1].content, /캡처해 두고/);
  assert.match(prompt[1].content, /단톡방/);
});

test("생성된 노랫말은 4줄씩 4마디로 검증한다", async () => {
  const lines = Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, bar) => `${row * 4 + bar + 1}번째 구절`));
  assert.deepEqual(parseLyrics(`\`\`\`json\n${JSON.stringify({ lines })}\n\`\`\``), lines);
  assert.deepEqual(parseLyrics(JSON.stringify({ bars: lines.flat() })), lines);
  assert.throws(() => parseLyrics(JSON.stringify({ lines: lines.slice(0, 3) })), /4줄·16마디/);
  assert.deepEqual(parseLyrics(JSON.stringify({ bars: ["별빛", "너의 곁에 있어", ...lines.flat().slice(2)] }))[0].slice(0, 2), ["별빛", "너의 곁에 있어"]);
  assert.throws(() => parseLyrics(JSON.stringify({ bars: ["나", ...lines.flat().slice(1)] })), /2~6글자/);
  assert.equal(parseLyrics(JSON.stringify({ bars: ["너의 마음을 들어", ...lines.flat().slice(1)] }))[0][0], "마음을 들어");
  assert.throws(() => parseLyrics("고정 가사 한 줄"), /형식/);

  let request;
  let calls = 0;
  const result = await generateClovaLyrics({
    scenario, messages, apiKey: "test-key",
    fetchImpl: async (_url, init) => {
      calls += 1;
      request = JSON.parse(init.body);
      return { ok: true, json: async () => ({ result: { message: { content: calls === 1 ? "형식이 틀린 가사" : JSON.stringify({ bars: lines.flat() }) } } }) };
    },
  });
  assert.deepEqual(result, lines);
  assert.equal(calls, 2);
  assert.equal(request.messages.at(-1).role, "user");
});

test("모델이 긴 마디를 내놓아도 뜻을 살린 짧은 구절로 다듬는다", async () => {
  const validBars = ["별빛", "너의 곁에 있어", "작은 용기", "함께 걸어", "마음 아파", "네 얘기", "듣고 있어", "네 잘못 아냐", "그 화면", "기록하자", "믿는 어른", "함께 말해", "오늘은", "조금 쉬어", "천천히", "다시 웃자"];
  let calls = 0;
  const result = await generateClovaLyrics({
    scenario, messages, apiKey: "test-key",
    fetchImpl: async () => {
      calls += 1;
      const bars = ["너의 마음을 들어", ...validBars.slice(1)];
      return { ok: true, json: async () => ({ result: { message: { content: JSON.stringify({ bars }) } } }) };
    },
  });
  assert.equal(calls, 1);
  assert.deepEqual(result.flat().slice(1), validBars.slice(1));
  assert.equal(result[0][0], "마음을 들어");
  assert.ok(result.flat().every((bar) => lyricCharacterCount(bar) >= 2 && lyricCharacterCount(bar) <= 6));
});

test("모델이 12~15마디만 세어도 긴 구절을 나눠 4줄·16마디로 맞춘다", () => {
  const draft = [
    "매일 밤 울며 잠들어", "숨겨둔 마음 조금씩 드러내", "괜찮아 다 잘될 거야", "내가 네 곁에서 항상 지켜줄게",
    "무슨 일 있으면 언제든 말해", "함께 고민하며 해결책을 찾아보자", "네 맘 알아주는 친구들 많아", "우리 모두 널 응원하고 있잖아",
    "단톡방 글 캡처 해둘게", "선생님과 상의해서 방법을 찾자", "넌 소중한 사람이니까 걱정마", "천천히 나아가도 괜찮아",
    "작은 변화부터 시작해보자", "매일 조금씩 용기를 내봐", "언젠간 웃으며 이 날을 기억할거야",
  ];
  for (const bars of [draft, draft.slice(0, 12)]) {
    const lines = parseLyrics(JSON.stringify({ bars }));
    assert.equal(lines.length, 4);
    assert.ok(lines.every((line) => line.length === 4));
    assert.ok(lines.flat().every((bar) => lyricCharacterCount(bar) >= 2 && lyricCharacterCount(bar) <= 6));
  }
  assert.throws(() => parseLyrics(JSON.stringify({ bars: draft.slice(0, 3) })), /4줄·16마디/);
});
