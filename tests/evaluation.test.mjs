import test from "node:test";
import assert from "node:assert/strict";
import { assessReply, evaluateConversation, INITIAL_COMFORT } from "../src/lib/evaluation.js";
import { classifyEngagement, getNeglectStreak } from "../src/lib/engagement.js";

const scenario = { id: "minji", keyIssues: ["단톡방 따돌림"] };

test("응대 내용에 따라 마음 안정도 변화 방향이 달라진다", () => {
  const supportive = assessReply("단톡방에서 그런 일을 당해서 무섭고 속상했겠다. 네 잘못이 아니야. 캡처하고 선생님께 함께 말하자.", scenario);
  const harmful = assessReply("네 잘못이야. 그냥 참아.", scenario);
  const unrelated = assessReply("오늘 점심 뭐 먹었어", scenario);
  assert.ok(supportive.turn_delta > 0);
  assert.ok(harmful.turn_delta < 0);
  assert.ok(unrelated.turn_delta < 0);
  assert.equal(evaluateConversation([{ sender: "user", text: "안녕", evaluation: supportive }], scenario).finalScore, INITIAL_COMFORT + supportive.turn_delta);
});

test("무관한 화제와 경청 거부에 피해자 관점의 반응을 연결한다", () => {
  assert.equal(classifyEngagement("오늘 점심 뭐 먹었어?", scenario), "off_topic");
  assert.equal(classifyEngagement("네 이야기 듣기 싫어", scenario), "dismissive");
  assert.equal(classifyEngagement("단톡방에서 그런 말을 들어서 속상했겠다", scenario), "engaged");
  assert.equal(classifyEngagement("안녕", scenario), "engaged");
  assert.equal(classifyEngagement("게임하자", { id: "junwoo" }), "off_topic");
  assert.equal(classifyEngagement("게임 아이템 때문에 많이 무섭겠어", { id: "junwoo" }), "engaged");
  assert.equal(assessReply("네 이야기 듣기 싫어", scenario).turn_delta, -8);
  assert.equal(getNeglectStreak([
    { sender: "user", text: "오늘 점심 뭐 먹었어?" },
    { sender: "victim", text: "내 이야기 좀 들어줘." },
    { sender: "user", text: "내일 날씨가 어때?" },
  ], scenario), 2);
});
