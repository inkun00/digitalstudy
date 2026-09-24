import { NextResponse } from "next/server";
import { SCENARIOS } from "@/lib/scenarios";
import { normalizeUserProfile } from "@/lib/userProfile";
import { ClovaChatError, generateClovaReply } from "@/lib/clovaChat";
import { FANTASY_ITEMS } from "@/lib/fantasyItems";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { scenarioId, messages, evaluation, userProfile } = await req.json();
    const counselor = normalizeUserProfile(userProfile);
    if (!counselor) return NextResponse.json({ error: "시작 화면에서 상담자 정보를 입력해 주세요." }, { status: 400 });
    const lastMessage = Array.isArray(messages) ? messages.at(-1) : null;
    const isGiftReply = lastMessage?.sender === "system" && FANTASY_ITEMS.some((item) => item.id === lastMessage.giftItemId);
    if (!Array.isArray(messages) || messages.length < 2 || messages.length > 80 || messages.some((message) =>
      !["user", "victim", "system"].includes(message?.sender) || typeof message.text !== "string" || message.text.length > 2000) ||
      (lastMessage?.sender !== "user" && !isGiftReply)) {
      return NextResponse.json({ error: "대화 형식이 올바르지 않습니다." }, { status: 400 });
    }
    const scenario = SCENARIOS.find((item) => item.id === scenarioId);
    if (!scenario) return NextResponse.json({ error: "대화 상대를 찾을 수 없습니다." }, { status: 400 });
    const reply = await generateClovaReply({ scenario, messages, evaluation, counselor, apiKey: process.env.CLOVA_STUDIO_API_KEY });
    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof ClovaChatError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[API /chat Error]:", error);
    return NextResponse.json({ error: "메시지 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
