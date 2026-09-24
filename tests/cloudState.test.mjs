import test from "node:test";
import assert from "node:assert/strict";
import { accountCacheBoundary, chatDirtyKey, chatStorageKey, chooseStoredValue } from "../src/lib/cloudState.js";

test("Firebase 기록과 기존 브라우저 기록을 손실 없이 선택한다", () => {
  assert.deepEqual(chooseStoredValue("local", null, false), { value: "local", needsUpload: true });
  assert.deepEqual(chooseStoredValue("old", "cloud", false), { value: "cloud", needsUpload: false });
  assert.deepEqual(chooseStoredValue("new", "cloud", true), { value: "new", needsUpload: true });
  assert.deepEqual(chooseStoredValue(null, null, false), { value: null, needsUpload: false });
  assert.equal(chatStorageKey("minji"), "heart_chat_session_v1:minji");
  assert.equal(chatDirtyKey("minji"), "heart_cloud_chat_dirty:minji");
});

test("계정을 바꾸면 이전 계정의 로컬 대화와 프로필을 분리한다", () => {
  assert.deepEqual(accountCacheBoundary("anonymous-user", "anonymous-user", "member-user"), { clearLocal: true, clearTab: true });
  assert.deepEqual(accountCacheBoundary("member-user", "other-user", "member-user"), { clearLocal: false, clearTab: true });
  assert.deepEqual(accountCacheBoundary("anonymous-user", "anonymous-user", "anonymous-user"), { clearLocal: false, clearTab: false });
  assert.deepEqual(accountCacheBoundary(null, null, "first-user"), { clearLocal: false, clearTab: false });
});
