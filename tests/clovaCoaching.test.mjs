import test from "node:test";
import assert from "node:assert/strict";
import { SCENARIOS } from "../src/lib/scenarios.js";
import { buildCoachingMessages, generateCoachingWithClova, parseCoaching } from "../src/lib/clovaCoaching.js";
import { ClovaChatError } from "../src/lib/clovaChat.js";

const scenario = SCENARIOS.find((item) => item.id === "seoyeon");
const counselor = { name: "서연", age: 11, gender: "female" };
const messages = [
  { sender: "victim", text: "사진이 퍼져서 무서워." },
  { sender: "user", text: "내가 함께 있을게." },
  { sender: "victim", text: "경찰에 신고하면 안전할까?" },
];

test("최신 피해자 발화와 이전 추천을 새 코칭 요청에 넣는다", () => {
  const prompt = buildCoachingMessages({ scenario, messages, counselor, previousReplies: ["내가 곁에 있을게."] });
  const context = JSON.parse(prompt[1].content);
  assert.equal(context.최신_피해자_말, "경찰에 신고하면 안전할까?");
  assert.deepEqual(context.이전_추천, ["내가 곁에 있을게."]);
  assert.match(prompt[0].content, /이전 답변을 그대로 반복하지 마세요/);
});

test("코칭 결과는 독립된 조언과 서로 다른 세 답변이어야 한다", async () => {
  const output = { advice_tip: "안전을 장담하지 말고 두려움을 먼저 들어 주세요.", suggested_replies: ["무서웠겠다. 네 곁에 있을게.", "지금은 안전한 곳에 있어?", "믿는 어른께 함께 말씀드릴까?"] };
  let request;
  const result = await generateCoachingWithClova({
    scenario, messages, counselor, previousReplies: [], apiKey: "test-key",
    fetchImpl: async (_url, init) => {
      request = JSON.parse(init.body);
      return { ok: true, json: async () => ({ result: { message: { content: JSON.stringify(output) } } }) };
    },
  });
  assert.deepEqual(result, output);
  assert.equal(request.messages[1].role, "user");
  assert.throws(() => parseCoaching('{"advice_tip":"조언","suggested_replies":["같아","같아","다름"]}'), ClovaChatError);
  await assert.rejects(generateCoachingWithClova({ scenario, messages, counselor, apiKey: "" }), (error) => error.status === 503);
});
