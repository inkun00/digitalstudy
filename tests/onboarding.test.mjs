import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUserProfile } from "../src/lib/userProfile.js";
import { SCENARIOS } from "../src/lib/scenarios.js";
import { SCENARIO_GUIDANCE } from "../src/lib/scenarioGuidance.js";

test("상담자 정보는 유효한 이름·성별·나이만 허용한다", () => {
  assert.deepEqual(normalizeUserProfile({ name: "  김 하늘  ", gender: "undisclosed", age: "12" }), {
    name: "김 하늘", gender: "undisclosed", age: 12,
  });
  assert.equal(normalizeUserProfile({ name: "--", gender: "male", age: 12 }), null);
  assert.equal(normalizeUserProfile({ name: "민수", gender: "male", age: 5 }), null);
  assert.equal(normalizeUserProfile({ name: "민수", gender: "unknown", age: 12 }), null);
});

test("모든 피해 사례에 상세 상황과 예방·대처 방법이 있다", () => {
  for (const scenario of SCENARIOS) {
    const guidance = SCENARIO_GUIDANCE[scenario.id];
    assert.ok(guidance?.details?.length > scenario.storyBrief.length / 2, `${scenario.id} details`);
    assert.ok(guidance?.prevention?.length >= 2, `${scenario.id} prevention`);
    assert.ok(guidance?.response?.length >= 2, `${scenario.id} response`);
  }
});
