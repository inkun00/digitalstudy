import test from "node:test";
import assert from "node:assert/strict";
import { SCENARIOS } from "../src/lib/scenarios.js";
import { migrateLegacyInitialMessages } from "../src/lib/scenarioMessageMigration.js";

const sua = SCENARIOS.find((scenario) => scenario.id === "sua");
const oldLines = [
  "나 진짜 큰일 났어... 숨이 안 쉬어져...",
  "예전에 제일 친했던 친구한테 비밀이라며 웃긴 표정 엽기 사진을 보낸 적이 있거든...",
  "근데 걔가 다른 애들이랑 짜고, 자기들 숙제 대신 안 해주면 그 사진을 학교 전교생 단톡방에 박제하겠대 ㅠㅠ",
];

test("수아의 저장된 시작 메시지 세 개만 새 사연으로 바꾸고 대화 기록은 보존한다", () => {
  const messages = [
    ...oldLines.map((text, index) => ({ id: `init-${index}-12345`, sender: "victim", text, time: "오전 9:30", unread: false })),
    { id: "user-1", sender: "user", text: "내가 도와줄게", time: "오전 9:31" },
    { id: "victim-1", sender: "victim", text: oldLines[1], time: "오전 9:32" },
  ];

  const migrated = migrateLegacyInitialMessages(sua, messages);
  assert.deepEqual(migrated.slice(0, 3).map((message) => message.text), sua.initialMessages);
  assert.deepEqual(migrated.slice(0, 3).map((message) => message.id), messages.slice(0, 3).map((message) => message.id));
  assert.deepEqual(migrated.slice(0, 3).map((message) => message.time), messages.slice(0, 3).map((message) => message.time));
  assert.deepEqual(migrated.slice(3), messages.slice(3));
  assert.equal(migrateLegacyInitialMessages(sua, migrated), migrated);
});

test("다른 친구와 수정된 기록에는 이관을 적용하지 않는다", () => {
  const messages = [{ id: "init-0-12345", sender: "victim", text: oldLines[0] }];
  assert.equal(migrateLegacyInitialMessages(SCENARIOS[0], messages), messages);
  assert.equal(migrateLegacyInitialMessages(sua, [{ ...messages[0], id: "victim-1" }])[0].text, oldLines[0]);
});
