import { NextResponse } from "next/server";
import { SCENARIOS } from "@/lib/scenarios";
import { INITIAL_COMFORT, clampScore, getSuggestedReplies } from "@/lib/evaluation";
import { ClovaChatError } from "@/lib/clovaChat";
import { evaluateReplyWithClova } from "@/lib/clovaEvaluation";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { scenarioId, messages, previousScore } = await req.json();
    if (!Array.isArray(messages) || messages.length < 2 || messages.length > 80 || messages.some((message) =>
      !["user", "victim", "system"].includes(message?.sender) || typeof message.text !== "string" || message.text.length > 2000) ||
      [...messages].reverse().find((message) => message.sender !== "system")?.sender !== "user") {
      return NextResponse.json({ error: "대화 형식이 올바르지 않습니다." }, { status: 400 });
    }

    const scenario = SCENARIOS.find((item) => item.id === scenarioId);
    if (!scenario) return NextResponse.json({ error: "대화 상대를 찾을 수 없습니다." }, { status: 400 });
    const lastReply = [...messages].reverse().find((message) => message.sender === "user")?.text || "";
    const assessment = await evaluateReplyWithClova({ scenario, messages, apiKey: process.env.CLOVA_STUDIO_API_KEY });
    const baseline = Number.isInteger(previousScore) && previousScore >= 0 && previousScore <= 100 ? previousScore : INITIAL_COMFORT;

    return NextResponse.json({
      ...assessment,
      evidence: lastReply.slice(0, 80),
      comfort_score: clampScore(baseline + assessment.turn_delta),
      current_emotion: assessment.turn_delta < 0 ? "상처와 불안이 커진 상태" : assessment.turn_delta > 0 ? "조금씩 안정을 찾는 중" : "여전히 불안한 상태",
      advice_tip: lastReply ? assessment.feedback : `${scenario.name}의 피해 상황을 듣고 감정을 먼저 인정해 주세요.`,
      suggested_replies: getSuggestedReplies(scenario),
    });
  } catch (error) {
    if (error instanceof ClovaChatError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("[API /coach Error]:", error);
    return NextResponse.json({ error: "응대 평가 중 오류가 발생했습니다." }, { status: 500 });
  }
}
