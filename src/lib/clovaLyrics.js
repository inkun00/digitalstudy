import { ClovaChatError } from "./clovaChat.js";
import { SCENARIO_GUIDANCE } from "./scenarioGuidance.js";

const CLOVA_ENDPOINT = "https://clovastudio.stream.ntruss.com/v3/chat-completions/HCX-005";

export function buildLyricsMessages(scenario, messages) {
  const dialogue = messages
    .filter((message) => (message.sender === "user" || message.sender === "victim") && message.text.trim())
    .slice(-24)
    .map((message) => ({ speaker: message.sender === "victim" ? scenario.name : "상담자", text: message.text.trim().slice(0, 400) }));

  return [
    {
      role: "system",
      content: [
        "너는 사이버폭력 피해 학생과 상담자의 실제 대화를 바탕으로 교육용 노랫말 예시를 쓰는 작사가다.",
        "서로 다른 4줄을 쓰고, 각 줄은 짧은 노랫말 4마디로 구성한다. 정확히 4줄 × 4마디, 총 16마디다. 1~4번이 첫 줄, 5~8번이 둘째 줄, 9~12번이 셋째 줄, 13~16번이 넷째 줄이다.",
        "피해 학생이 표현한 감정과 상담자가 실제로 건넨 위로·도움의 내용을 반영한다. 1~4마디는 마음의 어려움, 5~8마디는 경청과 공감, 9~12마디는 상담자가 실제로 제안한 안전한 행동, 13~16마디는 서두르지 않는 희망이다. 특히 9~12마디에는 상담자의 말에 나온 구체적 행동을 적어도 하나 넣고 대화에 없는 행동은 지어내지 않는다.",
        "피해자를 탓하지 않고 괴롭힘을 재현하거나 모욕적인 말을 반복하지 않는다. 가해자의 말이 진심이 아닐 것이라고 피해를 축소하거나 해결을 장담하지 않는다. 선물이나 점수로 피해가 즉시 해결됐다고 쓰지 않는다. 기존 노래 가사를 베끼지 않고 새로운 한국어 노랫말을 만든다.",
        "각 마디는 4~18글자 정도의 한 호흡에 부를 수 있는 짧은 구절로 쓰며 번호·제목·해설을 넣지 않는다. 반드시 JSON 객체 하나만 출력한다. bars는 16개의 서로 다른 가사 문자열이 순서대로 담긴 배열이다. 형식: {\"bars\":[\"가사1\",\"가사2\",\"가사3\",\"가사4\",\"가사5\",\"가사6\",\"가사7\",\"가사8\",\"가사9\",\"가사10\",\"가사11\",\"가사12\",\"가사13\",\"가사14\",\"가사15\",\"가사16\"]} 예시 문자열을 그대로 쓰지 않는다.",
      ].join("\n"),
    },
    {
      role: "user",
      content: JSON.stringify({
        피해_상황: SCENARIO_GUIDANCE[scenario.id]?.details || scenario.storyBrief,
        피해자가_말한_감정: dialogue.filter((entry) => entry.speaker === scenario.name).slice(-6).map((entry) => entry.text),
        상담자가_실제로_한_말: dialogue.filter((entry) => entry.speaker === "상담자").slice(-6).map((entry) => entry.text),
        실제_대화: dialogue,
      }),
    },
  ];
}

export function parseLyrics(content) {
  if (typeof content !== "string") throw new ClovaChatError("가사 생성 결과를 읽지 못했습니다. 다시 시도해 주세요.", 502);
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let value;
  try {
    value = JSON.parse(cleaned);
  } catch {
    throw new ClovaChatError("가사 형식이 올바르지 않습니다. 다시 생성해 주세요.", 502);
  }
  const lines = Array.isArray(value?.bars) && value.bars.length === 16
    ? Array.from({ length: 4 }, (_, index) => value.bars.slice(index * 4, index * 4 + 4))
    : value?.lines;
  if (!Array.isArray(lines) || lines.length !== 4 || lines.some((line) =>
    !Array.isArray(line) || line.length !== 4 || line.some((bar) => typeof bar !== "string" || !bar.trim() || bar.trim().length > 60))) {
    throw new ClovaChatError("가사가 4줄·16마디 형식으로 생성되지 않았습니다. 다시 시도해 주세요.", 502);
  }
  return lines.map((line) => line.map((bar) => bar.trim()));
}

export async function generateClovaLyrics({ scenario, messages, apiKey, fetchImpl = fetch }) {
  if (!apiKey?.trim()) throw new ClovaChatError("하이퍼클로바X API 키가 설정되지 않았습니다. 서버 설정을 확인해 주세요.", 503);
  const baseMessages = buildLyricsMessages(scenario, messages);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const prompt = attempt === 0 ? baseMessages : [
      { ...baseMessages[0], content: `${baseMessages[0].content}\n이전 출력은 형식이 맞지 않았다. 반드시 bars 배열에 짧은 한국어 가사 문자열을 정확히 16개 넣는다. 다른 글은 출력하지 않는다.` },
      baseMessages[1],
    ];
    let response;
    try {
      response = await fetchImpl(CLOVA_ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey.trim()}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ messages: prompt, maxTokens: 850, temperature: attempt === 0 ? 0.65 : 0.35, repetitionPenalty: 1.1 }),
        signal: AbortSignal.timeout(30000),
        cache: "no-store",
      });
    } catch (error) {
      if (error?.name === "TimeoutError") throw new ClovaChatError("가사 생성 시간이 초과됐습니다. 다시 시도해 주세요.", 504);
      throw new ClovaChatError("하이퍼클로바X에 연결하지 못했습니다. 다시 시도해 주세요.", 502);
    }
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new ClovaChatError("하이퍼클로바X API 키 인증에 실패했습니다. 서버 설정을 확인해 주세요.", 503);
      throw new ClovaChatError("가사를 생성하지 못했습니다. 다시 시도해 주세요.", 502);
    }

    let payload;
    try { payload = await response.json(); }
    catch { throw new ClovaChatError("가사 생성 결과를 읽지 못했습니다. 다시 시도해 주세요.", 502); }
    try { return parseLyrics(payload?.result?.message?.content); }
    catch (error) { if (attempt === 1) throw error; }
  }
}
