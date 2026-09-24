import test from "node:test";
import assert from "node:assert/strict";
import { SCENARIOS } from "../src/lib/scenarios.js";
import { buildLyricsMessages, generateClovaLyrics, parseLyrics } from "../src/lib/clovaLyrics.js";

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
  assert.match(prompt[1].content, /학교 가기 무서워/);
  assert.match(prompt[1].content, /캡처해 두고/);
  assert.match(prompt[1].content, /단톡방/);
});

test("생성된 노랫말은 4줄씩 4마디로 검증한다", async () => {
  const lines = Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, bar) => `${row * 4 + bar + 1}번째 구절`));
  assert.deepEqual(parseLyrics(`\`\`\`json\n${JSON.stringify({ lines })}\n\`\`\``), lines);
  assert.deepEqual(parseLyrics(JSON.stringify({ bars: lines.flat() })), lines);
  assert.throws(() => parseLyrics(JSON.stringify({ lines: lines.slice(0, 3) })), /4줄·16마디/);
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
