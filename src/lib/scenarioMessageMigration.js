const LEGACY_SUA_INITIAL_MESSAGES = [
  "나 진짜 큰일 났어... 숨이 안 쉬어져...",
  "예전에 제일 친했던 친구한테 비밀이라며 웃긴 표정 엽기 사진을 보낸 적이 있거든...",
  "근데 걔가 다른 애들이랑 짜고, 자기들 숙제 대신 안 해주면 그 사진을 학교 전교생 단톡방에 박제하겠대 ㅠㅠ",
];

export function migrateLegacyInitialMessages(scenario, messages) {
  if (scenario?.id !== "sua" || !Array.isArray(messages)) return messages;

  let changed = false;
  const migrated = messages.map((message) => {
    const match = /^init-([0-2])-\d+$/.exec(message?.id || "");
    const index = match ? Number(match[1]) : -1;
    if (message?.sender !== "victim" || message.text !== LEGACY_SUA_INITIAL_MESSAGES[index]) return message;
    changed = true;
    return { ...message, text: scenario.initialMessages[index] };
  });

  return changed ? migrated : messages;
}
