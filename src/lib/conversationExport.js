const SENDER_LABELS = { user: "나", system: "선물·안내" };

export function conversationRows(messages, victimName) {
  return messages
    .filter((message) => ["user", "victim", "system"].includes(message?.sender) && typeof message.text === "string")
    .map((message, index) => ({
      order: index + 1,
      time: typeof message.time === "string" ? message.time : "",
      sender: SENDER_LABELS[message.sender] || victimName,
      text: message.text,
    }));
}

export function conversationPlainText(messages, victimName) {
  return conversationRows(messages, victimName)
    .map(({ time, sender, text }) => `${time ? `[${time}] ` : ""}${sender}: ${text}`)
    .join("\n");
}

function csvCell(value) {
  const text = String(value ?? "");
  // Spreadsheet apps can execute cells beginning with formula characters.
  const safe = /^[\s\uFEFF]*[=+\-@]/u.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function conversationCsv(messages, victimName) {
  const rows = [
    ["순서", "시간", "화자", "내용"],
    ...conversationRows(messages, victimName).map(({ order, time, sender, text }) => [order, time, sender, text]),
  ];
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
