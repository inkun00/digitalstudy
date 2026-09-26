import { NextResponse } from "next/server";
import { SCENARIOS } from "@/lib/scenarios";
import { normalizeUserProfile } from "@/lib/userProfile";
import { ClovaChatError } from "@/lib/clovaChat";
import { generateCoachingWithClova } from "@/lib/clovaCoaching";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { scenarioId, messages, userProfile, previousReplies = [] } = await req.json();
    const scenario = SCENARIOS.find((item) => item.id === scenarioId);
    const counselor = normalizeUserProfile(userProfile);
    if (!scenario || !counselor) return NextResponse.json({ error: "대화 상대나 상담자 정보를 확인해 주세요." }, { status: 400 });
    if (!Array.isArray(messages) || messages.length < 1 || messages.length > 80 ||
      messages.some((message) => !["user", "victim", "system"].includes(message?.sender) || typeof message.text !== "string" || message.text.length > 2000) ||
      !messages.some((message) => message.sender === "victim") ||
      !Array.isArray(previousReplies) || previousReplies.length > 3 || previousReplies.some((reply) => typeof reply !== "string" || reply.length > 180)) {
      return NextResponse.json({ error: "대화 형식이 올바르지 않습니다." }, { status: 400 });
    }
    const coaching = await generateCoachingWithClova({ scenario, messages, counselor, previousReplies, apiKey: process.env.CLOVA_STUDIO_API_KEY });
    return NextResponse.json(coaching);
  } catch (error) {
    if (error instanceof ClovaChatError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[API /coach-suggestions Error]:", error);
    return NextResponse.json({ error: "상담 조언을 만들지 못했어요." }, { status: 500 });
  }
}
