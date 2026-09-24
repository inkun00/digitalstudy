import test from "node:test";
import assert from "node:assert/strict";
import { SCENARIOS } from "../src/lib/scenarios.js";
import { buildEvaluationMessages, evaluateReplyWithClova, parseEvaluation } from "../src/lib/clovaEvaluation.js";
import { ClovaChatError } from "../src/lib/clovaChat.js";

const scenario = SCENARIOS.find((item) => item.id === "seoyeon");
const messages = [
  { sender: "victim", text: "사진이 계속 인터넷에 돌아다녀서 어떡하지?" },
  { sender: "user", text: "하루 빨리 경찰에 신고해서 퍼지는 걸 막아야 될 것 같아" },
  { sender: "victim", text: "경찰에 신고하면 안전해질 수 있을까? 도와줄 거지?" },
  { sender: "user", text: "응, 같이 가줄게" },
];

test("평가 요청은 짧은 답변과 그 앞의 도움 요청을 함께 전달한다", async () => {
  const requestMessages = buildEvaluationMessages(scenario, messages);
  assert.match(requestMessages[0].content, /'응, 같이 가줄게'/);
  const context = JSON.parse(requestMessages[1].content);
  assert.equal(context.대화.at(-2).text, "경찰에 신고하면 안전해질 수 있을까? 도와줄 거지?");
  assert.equal(context.대화.at(-1).text, "응, 같이 가줄게");

  let sent;
  const assessment = await evaluateReplyWithClova({
    scenario, messages, apiKey: "test-key",
    fetchImpl: async (_url, init) => {
      sent = JSON.parse(init.body);
      return { ok: true, json: async () => ({ result: { message: { content: '{"impact":"supportive","feedback":"도움을 요청한 서연이에게 함께 가겠다고 답해 든든함을 주었어요."}' } } }) };
    },
  });
  assert.equal(assessment.turn_delta, 5);
  assert.match(assessment.feedback, /함께 가겠다고/);
  assert.equal(sent.messages[1].role, "user");
});

test("잘못된 모델 점수는 포인트에 반영하지 않는다", async () => {
  assert.deepEqual(parseEvaluation('```json\n{"impact":"supportive","feedback":"곁에 있겠다는 답변이에요."}\n```'), {
    turn_delta: 5, feedback: "곁에 있겠다는 답변이에요.",
  });
  assert.throws(() => parseEvaluation('{"impact":"perfect","feedback":"완벽해요."}'), ClovaChatError);
  await assert.rejects(evaluateReplyWithClova({ scenario, messages, apiKey: "" }), (error) => error.status === 503);
});
