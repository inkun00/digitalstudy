import { classifyEngagement, scenarioTopicPatterns } from "./engagement.js";

export const INITIAL_COMFORT = 25;

export function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function assessReply(text, scenario) {
  const reply = String(text || "").trim();
  if (!reply) return { turn_delta: 0, evidence: "", feedback: "친구의 이야기를 듣고 답해 주세요." };
  const withoutReassurance = reply.replace(/(?:네|니)\s*(?:잘못|탓)이\s*아니(?:야|에요|다)?/g, "");
  const harmful = /네\s*잘못|니\s*잘못|너\s*때문|네\s*탓|니\s*탓|참아|별일\s*아니|그냥\s*무시|오버|유난|네가\s*먼저|똑같이\s*(욕|때|보복)|복수|그냥\s*(줘|넘겨)/.test(withoutReassurance);
  if (harmful) return { turn_delta: -10, evidence: reply.slice(0, 80), feedback: "피해자를 탓하거나 위험한 대응을 권하면 마음이 더 불안해질 수 있어요." };
  const engagement = classifyEngagement(reply, scenario);
  if (engagement === "dismissive") return { turn_delta: -8, evidence: reply.slice(0, 80), feedback: "친구의 이야기를 듣지 않겠다는 말은 더 큰 외로움과 상처를 줄 수 있어요." };
  if (engagement === "off_topic") return { turn_delta: -3, evidence: reply.slice(0, 80), feedback: "지금은 다른 주제보다 친구가 겪은 일과 감정을 먼저 들어주세요." };

  const empathy = /무서|속상|힘들|아프|놀랐|두렵|슬프|괜찮|마음|공감|이야기\s*들|들어줄|곁에|함께|네\s*편|니\s*편|혼자\s*아니|잘못이\s*아니|탓이\s*아니/.test(reply);
  const understanding = (scenarioTopicPatterns[scenario?.id] || /피해|폭력/).test(reply);
  const preserve = /캡처|증거|기록|저장|스크린샷|URL/.test(reply);
  const support = /부모님|보호자|선생님|담임|어른|상담|117|1388|112|신고|지원센터/.test(reply);
  const safeAction = /차단|삭제\s*요청|비밀번호\s*변경|2단계\s*인증|안전한\s*곳|혼자\s*가지/.test(reply);
  const question = /\?|어떻|무슨\s*일|언제|지금\s*안전|말해\s*줄/.test(reply);
  const delta = Math.min(16, (empathy ? 6 : 0) + (understanding ? 3 : 0) + (preserve ? 3 : 0) + (support ? 4 : 0) + (safeAction ? 3 : 0) + (question ? 2 : 0));
  const feedback = delta === 0
    ? "친구의 감정을 인정하고, 실제로 겪은 일에 맞는 안전한 도움을 제안해 보세요."
    : [empathy && "감정을 받아주었어요", understanding && "피해 상황을 짚었어요", (preserve || support || safeAction) && "안전한 대처를 제안했어요", question && "친구의 이야기를 더 물었어요"].filter(Boolean).join(". ") + ".";
  return { turn_delta: delta, evidence: reply.slice(0, 80), feedback };
}

export function evaluateConversation(messages, scenario) {
  const assessments = messages.filter((message) => message.sender === "user").map((message) => message.evaluation || assessReply(message.text, scenario));
  return {
    assessments,
    finalScore: assessments.reduce((score, item) => clampScore(score + (Number(item.turn_delta) || 0)), INITIAL_COMFORT),
  };
}
