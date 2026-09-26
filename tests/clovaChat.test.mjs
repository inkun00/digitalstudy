import test from "node:test";
import assert from "node:assert/strict";
import { SCENARIOS } from "../src/lib/scenarios.js";
import { FANTASY_ITEMS } from "../src/lib/fantasyItems.js";
import { buildClovaMessages, ClovaChatError, generateClovaReply, isOutOfCharacterReply } from "../src/lib/clovaChat.js";

const scenario = SCENARIOS[0];
const counselor = { name: "하늘", age: 12, gender: "undisclosed" };
const dialogue = [
  { sender: "victim", text: "학교에 가기 무서워." },
  { sender: "system", text: "마법 아이템 사용" },
  { sender: "user", text: "네 잘못이 아니야. 지금 안전한 곳에 있어?" },
];

test("하이퍼클로바X 요청에 피해 상황과 실제 대화 이력을 담는다", async () => {
  const modelMessages = buildClovaMessages({ scenario, counselor, messages: dialogue, evaluation: { turn_delta: 7 } });
  assert.equal(modelMessages[0].role, "system");
  assert.match(modelMessages[0].content, /민지/);
  assert.match(modelMessages[0].content, /하늘/);
  assert.match(modelMessages[0].content, /단체 채팅방/);
  assert.match(modelMessages[0].content, /별도의 상담 도우미가 담당한다/);
  assert.deepEqual(modelMessages.slice(1), [
    { role: "assistant", content: "학교에 가기 무서워." },
    { role: "user", content: "네 잘못이 아니야. 지금 안전한 곳에 있어?" },
  ]);

  let request;
  const reply = await generateClovaReply({
    scenario, counselor, messages: dialogue, evaluation: { turn_delta: 7 }, apiKey: "test-key",
    fetchImpl: async (url, init) => {
      request = { url, ...init };
      return { ok: true, json: async () => ({ result: { message: { content: "  고마워... 조금 안심돼.  " } } }) };
    },
  });
  assert.equal(reply, "고마워... 조금 안심돼.");
  assert.match(request.url, /\/v3\/chat-completions\/HCX-005$/);
  assert.equal(request.headers.Authorization, "Bearer test-key");
  assert.equal(JSON.parse(request.body).messages.at(-1).role, "user");
});

test("피해자의 절차 안내형 답장을 다시 생성하고 짧은 감정 표현만 전달한다", async () => {
  const responses = [
    "신고하려면 https://example.org 에 접속해서 화면을 저장하세요.",
    "고마워. 아직 겁나지만 네가 같이 있어 주면 선생님께 말해 볼 수 있을 것 같아.",
  ];
  let calls = 0;
  const reply = await generateClovaReply({
    scenario, counselor, messages: dialogue, apiKey: "test-key",
    fetchImpl: async () => ({ ok: true, json: async () => ({ result: { message: { content: responses[calls++] } } }) }),
  });
  assert.equal(calls, 2);
  assert.equal(reply, responses[1]);
  assert.equal(isOutOfCharacterReply(responses[0]), true);
  assert.equal(isOutOfCharacterReply(responses[1]), false);
  assert.equal(isOutOfCharacterReply("단톡방을 캡처해 뒀는데 아직 무서워."), false);
});

test("다시 생성해도 기관 안내문이면 피해자 채팅에 표시하지 않는다", async () => {
  let calls = 0;
  await assert.rejects(generateClovaReply({
    scenario, counselor, messages: dialogue, apiKey: "test-key",
    fetchImpl: async () => {
      calls += 1;
      return { ok: true, json: async () => ({ result: { message: { content: "신고 사이트 www.example.org 에 접속하세요." } } }) };
    },
  }), (error) => error instanceof ClovaChatError && error.status === 502);
  assert.equal(calls, 2);
});

test("대화가 이어지면 사용자 이름을 가끔 부르고 최근에 불렀다면 반복하지 않는다", () => {
  const turns = [
    { sender: "victim", text: "학교에 가기 무서워." },
    { sender: "user", text: "그랬구나. 무서웠겠다." },
    { sender: "victim", text: "응, 계속 생각나." },
    { sender: "user", text: "내가 듣고 있을게." },
    { sender: "victim", text: "고마워." },
    { sender: "user", text: "천천히 말해줘." },
  ];
  const earlyPrompt = buildClovaMessages({ scenario, counselor, messages: turns.slice(0, 4) });
  assert.match(earlyPrompt[0].content, /이번 답장에 억지로 넣지 않는다/);

  const namePrompt = buildClovaMessages({ scenario, counselor, messages: turns });
  assert.match(namePrompt[0].content, /이번 답장에는 대화 흐름에 맞게 상대 이름 하늘을 한 번 자연스럽게 부른다/);

  const recentlyNamed = turns.map((message, index) => index === 4 ? { ...message, text: "하늘아, 고마워." } : message);
  const repeatPrompt = buildClovaMessages({ scenario, counselor, messages: recentlyNamed });
  assert.match(repeatPrompt[0].content, /최근 답장에서 이름을 불렀다면 특히 반복하지 않는다/);
});

test("선물은 친구의 대화 맥락에 포함하고 일반 시스템 알림은 제외한다", () => {
  const gift = FANTASY_ITEMS[0];
  const modelMessages = buildClovaMessages({
    scenario, counselor, messages: [
      { sender: "victim", text: "아직 좀 무서워." },
      { sender: "system", text: "일반 알림" },
      { sender: "system", giftItemId: gift.id, text: "선물을 보냈어요." },
      { sender: "user", text: "조금 쉬어도 괜찮아." },
    ],
  });
  assert.equal(modelMessages.length, 4);
  assert.match(modelMessages[2].content, new RegExp(gift.name));
  assert.equal(modelMessages.at(-1).content, "조금 쉬어도 괜찮아.");
});

test("선물을 받은 직후에는 아이템 설명과 피해 맥락에 맞는 답장을 요청한다", async () => {
  const gift = FANTASY_ITEMS[0];
  let sentMessages;
  let calls = 0;
  const reply = await generateClovaReply({
    scenario, counselor,
    messages: [
      { sender: "victim", text: "내 얘기를 아무도 안 들어주는 것 같아." },
      { sender: "system", giftItemId: gift.id, text: "선물 전달" },
    ],
    apiKey: "test-key",
    fetchImpl: async (_url, init) => {
      calls += 1;
      sentMessages = JSON.parse(init.body).messages;
      return { ok: true, json: async () => ({ result: { message: { content: calls === 1 ? "고마워... 내 얘기를 들어주는 느낌이야." : `${gift.name} 고마워. 내 얘기를 들어주는 느낌이야.` } } }) };
    },
  });
  assert.equal(calls, 2);
  assert.match(reply, new RegExp(gift.name));
  assert.match(sentMessages[0].content, new RegExp(gift.name));
  assert.match(sentMessages[0].content, /선물 하나로 피해가 해결되거나/);
  assert.equal(sentMessages.at(-1).role, "user");
  assert.match(sentMessages.at(-1).content, new RegExp(gift.description));
  assert.match(sentMessages.at(-1).content, new RegExp(gift.effect));
});

test("관련 없는 선물에는 억지로 안심한 척하지 않도록 요청한다", () => {
  const gift = FANTASY_ITEMS.find((item) => item.id === "fantasy-028");
  const prompt = buildClovaMessages({
    scenario, counselor,
    messages: [{ sender: "system", giftItemId: gift.id, giftBoost: 0, giftMatched: false, text: "선물 전달" }],
  });
  assert.match(prompt[0].content, /가장 큰 걱정과는 거리가 있다/);
  assert.match(prompt[0].content, /안심했다고 억지로 말하지 않는다/);
});

test("API 키와 모델 응답이 없으면 규칙형 답장으로 대체하지 않는다", async () => {
  await assert.rejects(
    generateClovaReply({ scenario, counselor, messages: dialogue, apiKey: "" }),
    (error) => error instanceof ClovaChatError && error.status === 503,
  );
  await assert.rejects(
    generateClovaReply({ scenario, counselor, messages: dialogue, apiKey: "test-key", fetchImpl: async () => ({ ok: true, json: async () => ({ result: { message: { content: " " } } }) }) }),
    (error) => error instanceof ClovaChatError && error.status === 502,
  );
});
