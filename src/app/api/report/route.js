import { NextResponse } from "next/server";
import { SCENARIOS } from "@/lib/scenarios";
import { INITIAL_COMFORT, clampScore, evaluateConversation } from "@/lib/evaluation";

function buildFallback(messages, scenario, finalScore, assessments, itemBonus) {
  const replies = messages.filter((message) => message.sender === "user").map((message) => message.text).join(" ");
  const empathy = /무서|속상|힘들|괜찮|네\s*편|잘못이\s*아니|이야기\s*들/.test(replies);
  const action = /캡처|증거|선생님|부모님|보호자|117|신고|차단|비밀번호|삭제/.test(replies);
  const harmful = assessments.some((item) => item.turn_delta < 0);
  const applied = [];
  if (empathy) applied.push("피해자의 감정을 인정하고 위로함");
  if (/캡처|증거|기록|저장/.test(replies)) applied.push("피해 기록을 보존하도록 제안함");
  if (/선생님|부모님|보호자|117|신고/.test(replies)) applied.push("믿을 수 있는 어른 또는 지원 기관에 도움을 요청하도록 안내함");
  if (/차단|비밀번호|삭제/.test(replies)) applied.push("추가 피해를 막을 조치를 제안함");
  const feedback = harmful
    ? "친구에게 상처가 될 수 있는 표현이 있었어요. 먼저 두려운 마음을 인정하고 피해자의 잘못이 아님을 알려 주세요."
    : applied.length
      ? `대화에서 ${applied.join(", ")}을 확인했어요. 다음에는 ${scenario.name}가 실제로 원하는 도움을 물어보고 함께 안전한 어른에게 연결해 주세요.`
      : "아직 대화에서 구체적인 공감이나 안전한 대처 제안을 확인하기 어려워요. 친구의 마음을 묻는 말부터 시작해 보세요.";
  return {
    empathy_score: empathy && !harmful ? 75 : empathy ? 35 : 20,
    problem_analysis_score: scenario.keyIssues.some((issue) => replies.includes(issue)) ? 80 : 30,
    action_solution_score: action && !harmful ? 75 : action ? 35 : 20,
    cyber_type_detected: scenario.cyberType,
    applied_solutions: applied,
    teacher_feedback: feedback,
    initial_score: INITIAL_COMFORT,
    final_score: clampScore(finalScore + itemBonus),
    item_bonus: itemBonus,
  };
}

export async function POST(req) {
  try {
    const { scenarioId, messages, itemBonus } = await req.json();
    if (!Array.isArray(messages) || messages.length > 80 || messages.some((m) => typeof m.text !== "string" || m.text.length > 2000)) {
      return NextResponse.json({ error: "대화 형식이 올바르지 않습니다." }, { status: 400 });
    }
    const scenario = SCENARIOS.find((item) => item.id === scenarioId) || SCENARIOS[0];
    const { finalScore, assessments } = evaluateConversation(messages, scenario);
    const safeItemBonus = Number.isInteger(itemBonus) && itemBonus >= 0 && itemBonus <= 20 ? itemBonus : 0;
    return NextResponse.json(buildFallback(messages, scenario, finalScore, assessments, safeItemBonus));
  } catch (error) {
    console.error("[API /report Error]:", error);
    return NextResponse.json({ error: "리포트 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
