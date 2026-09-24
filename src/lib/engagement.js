export const scenarioTopicPatterns = {
  minji: /단톡|따돌|비웃|욕설|조롱|학교|배척/,
  junwoo: /아이템|협박|때리|갈취|게임.{0,8}(?:아이템|협박|형)/,
  seoyeon: /합성|딥페이크|사진|유포|게시물/,
  doyoon: /계정|비밀번호|해킹|사칭|접속/,
  haeun: /소문|거짓|허위|게시판|댓글/,
  jiho: /서버|아바타|메타버스|따라|귓속말|차단|게임.{0,8}(?:괴롭|쫓|무섭)/,
  yeeun: /악플|댓글|외모|영상|차단/,
  siwoo: /핫스팟|데이터|요금|협박/,
  sua: /사진|박제|협박|숙제|유포/,
  hyunwoo: /투표|채팅|비웃|조롱|놀림|모욕/,
};

const dismissivePattern = /(?:네|니)\s*(?:잘못|탓)|너\s*때문|별일\s*아니|그냥\s*(?:참아|무시|줘|넘겨)|오버|유난|관심\s*없|상관\s*없|알\s*바\s*아니|귀찮|그만\s*(?:말|얘기)|입\s*다물|듣기\s*싫|도와(?:줄|주기)\s*싫/;
const diversionPattern = /(?:게임|끝말잇기)\s*(?:하자|할래|할까)|(?:같이|함께)\s*게임\s*(?:하자|할래)|영화\s*(?:보자|볼래)|숙제\s*(?:해\s*줘|풀어\s*줘)|사진\s*찍(?:자|을까)/;
const carePattern = /무서|속상|힘들|아프|놀랐|두렵|슬프|괜찮|마음|기분|걱정|안전|피해|폭력|네\s*편|니\s*편|잘못이\s*아니|탓이\s*아니|도와|말해|들어|함께|어른|선생|부모|보호자|신고|캡처|증거|기록|차단|무슨\s*일|어떻게\s*됐|언제부터|그때|그\s*뒤|그\s*일|지금은|상대가|누가/;

export function classifyEngagement(text, scenario) {
  const reply = String(text || "").trim();
  if (!reply || /^(?:안녕|응|그래|알겠어|고마워)[!?.~\s]*$/.test(reply)) return "engaged";
  const withoutReassurance = reply.replace(/(?:네|니)\s*(?:잘못|탓)이\s*아니(?:야|에요|다)?/g, "");
  if (dismissivePattern.test(withoutReassurance)) return "dismissive";
  if (diversionPattern.test(reply)) return "off_topic";
  if (carePattern.test(reply) || (scenarioTopicPatterns[scenario?.id] || /피해|폭력/).test(reply)) return "engaged";
  return reply.length >= 5 ? "off_topic" : "engaged";
}

export function getNeglectStreak(messages, scenario) {
  let count = 0;
  for (const message of [...messages].reverse()) {
    if (message.sender !== "user") continue;
    if (classifyEngagement(message.text, scenario) === "engaged") break;
    count += 1;
  }
  return count;
}
