import test from "node:test";
import assert from "node:assert/strict";
import { conversationCsv, conversationPlainText } from "../src/lib/conversationExport.js";

const messages = [
  { sender: "victim", text: "안녕, 친구야", time: "오전 9:00" },
  { sender: "user", text: '네 이야기,\n"들어줄게"', time: "오전 9:01" },
  { sender: "system", text: "노래를 선물했어요.", time: "오전 9:02" },
];

test("클립보드 복사에는 대화 순서, 화자, 원문을 담는다", () => {
  assert.equal(conversationPlainText(messages, "수아"), '[오전 9:00] 수아: 안녕, 친구야\n[오전 9:01] 나: 네 이야기,\n"들어줄게"\n[오전 9:02] 선물·안내: 노래를 선물했어요.');
});

test("CSV는 한글 BOM, CRLF, 쉼표·줄바꿈·따옴표 이스케이프를 갖는다", () => {
  assert.equal(conversationCsv(messages, "수아"), '\uFEFF"순서","시간","화자","내용"\r\n"1","오전 9:00","수아","안녕, 친구야"\r\n"2","오전 9:01","나","네 이야기,\n""들어줄게"""\r\n"3","오전 9:02","선물·안내","노래를 선물했어요."\r\n');
});

test("CSV의 수식으로 해석될 수 있는 사용자 입력은 문자로 보존한다", () => {
  assert.match(conversationCsv([{ sender: "user", text: "=SUM(1,2)" }], "수아"), /"'=SUM\(1,2\)"/);
});
