import { ClovaChatError } from "./clovaChat.js";
import { SCENARIO_GUIDANCE } from "./scenarioGuidance.js";

const CLOVA_ENDPOINT = "https://clovastudio.stream.ntruss.com/v3/chat-completions/HCX-005";
const WEAK_LYRIC_WORDS = new Set(["그리고", "하지만", "그냥", "것도", "좋아", "거야", "수"]);

export function lyricCharacterCount(bar) {
  return Array.from(bar.normalize("NFC").replace(/[^\p{L}\p{N}]/gu, "")).length;
}

function shortenLyricBar(bar) {
  const clean = bar.trim().replace(/\s+/g, " ");
  if (lyricCharacterCount(clean) <= 6) return clean;

  const words = clean.match(/[\p{L}\p{N}]+/gu) || [];
  let best = null;
  for (let start = 0; start < words.length; start += 1) {
    let length = 0;
    for (let end = start; end < words.length; end += 1) {
      length += lyricCharacterCount(words[end]);
      if (length > 6) break;
      if (length < 2) continue;
      const phraseWords = words.slice(start, end + 1);
      const score = length + (end === words.length - 1 ? 2.5 : 0) -
        (phraseWords.every((word) => WEAK_LYRIC_WORDS.has(word)) ? 5 : 0);
      if (!best || score > best.score) best = { text: phraseWords.join(" "), score };
    }
  }
  if (best) return best.text;
  return Array.from(words[0] || "").slice(0, 6).join("");
}

function splitLyricBar(bar) {
  const words = bar.match(/[\p{L}\p{N}]+/gu) || [];
  let best = null;
  for (let index = 1; index < words.length; index += 1) {
    const left = shortenLyricBar(words.slice(0, index).join(" "));
    const right = shortenLyricBar(words.slice(index).join(" "));
    const leftLength = lyricCharacterCount(left);
    const rightLength = lyricCharacterCount(right);
    if (leftLength < 2 || rightLength < 2 || leftLength > 6 || rightLength > 6) continue;
    const score = leftLength + rightLength - Math.abs(leftLength - rightLength) / 2;
    if (!best || score > best.score) best = { parts: [left, right], score };
  }
  return best;
}

function completeLyricBars(bars) {
  const completed = [...bars];
  while (completed.length < 16) {
    let best = null;
    for (let index = 0; index < completed.length; index += 1) {
      const split = splitLyricBar(completed[index]);
      if (split && (!best || split.score > best.score)) best = { index, ...split };
    }
    if (!best) break;
    completed.splice(best.index, 1, ...best.parts);
  }
  return completed;
}

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
        "가장 중요한 제한: 각 마디는 공백과 문장부호를 제외하고 반드시 2~6글자다. 긴 문장이나 완성형 설명을 쓰지 말고 노래 한 호흡에 부를 짧은 구절만 쓴다. 예를 들어 '별빛'은 2글자, '너의 곁에 있어'는 6글자다. 번호·제목·해설을 넣지 않는다. 반드시 JSON 객체 하나만 출력한다. bars는 16개의 서로 다른 가사 문자열이 순서대로 담긴 배열이다. 형식: {\"bars\":[\"가사1\",\"가사2\",\"가사3\",\"가사4\",\"가사5\",\"가사6\",\"가사7\",\"가사8\",\"가사9\",\"가사10\",\"가사11\",\"가사12\",\"가사13\",\"가사14\",\"가사15\",\"가사16\"]} 예시 문자열을 그대로 쓰지 않는다.",
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
  const bars = Array.isArray(value?.bars) && value.bars.length >= 8 && value.bars.length <= 16 &&
    value.bars.every((bar) => typeof bar === "string" && bar.trim() && bar.length <= 120)
    ? completeLyricBars(value.bars)
    : null;
  const lines = bars?.length === 16
    ? Array.from({ length: 4 }, (_, index) => bars.slice(index * 4, index * 4 + 4))
    : value?.lines;
  if (!Array.isArray(lines) || lines.length !== 4 || lines.some((line) =>
    !Array.isArray(line) || line.length !== 4 || line.some((bar) => typeof bar !== "string" || !bar.trim() || bar.length > 120))) {
    throw new ClovaChatError("가사가 4줄·16마디 형식으로 생성되지 않았습니다. 다시 시도해 주세요.", 502);
  }
  const shortLines = lines.map((line) => line.map(shortenLyricBar));
  if (shortLines.some((line) => line.some((bar) => lyricCharacterCount(bar) < 2 || lyricCharacterCount(bar) > 6))) {
    throw new ClovaChatError("각 마디는 공백을 뺀 2~6글자로 생성되어야 합니다. 다시 시도해 주세요.", 502);
  }
  return shortLines;
}

export async function generateClovaLyrics({ scenario, messages, apiKey, fetchImpl = fetch }) {
  if (!apiKey?.trim()) throw new ClovaChatError("하이퍼클로바X API 키가 설정되지 않았습니다. 서버 설정을 확인해 주세요.", 503);
  const baseMessages = buildLyricsMessages(scenario, messages);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const prompt = attempt === 0 ? baseMessages : [
      { ...baseMessages[0], content: `${baseMessages[0].content}\n이전 출력은 형식이나 글자 수가 맞지 않았다. 반드시 bars 배열에 정확히 16마디를 넣고, 마디마다 공백·문장부호를 제외한 글자 수를 세어 2~6글자로 고친 뒤 출력한다. 다른 글은 출력하지 않는다.` },
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
