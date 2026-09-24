import { NextResponse } from "next/server";
import { SCENARIOS } from "@/lib/scenarios";
import { ClovaChatError } from "@/lib/clovaChat";
import { generateClovaLyrics } from "@/lib/clovaLyrics";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { scenarioId, messages } = await req.json();
    const scenario = SCENARIOS.find((item) => item.id === scenarioId);
    if (!scenario) return NextResponse.json({ error: "대화 상대를 찾을 수 없어요." }, { status: 400 });
    if (!Array.isArray(messages) || messages.length < 2 || messages.length > 80 || messages.some((message) =>
      !["user", "victim", "system"].includes(message?.sender) || typeof message.text !== "string" || message.text.length > 2000) ||
      !messages.some((message) => message.sender === "user") || !messages.some((message) => message.sender === "victim")) {
      return NextResponse.json({ error: "가사를 만들 대화 내용이 부족하거나 형식이 올바르지 않아요." }, { status: 400 });
    }
    const lines = await generateClovaLyrics({ scenario, messages, apiKey: process.env.CLOVA_STUDIO_API_KEY });
    return NextResponse.json({ lines });
  } catch (error) {
    if (error instanceof ClovaChatError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[API /lyrics Error]:", error);
    return NextResponse.json({ error: "노랫말 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
