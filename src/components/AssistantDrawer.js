"use client";

import React from "react";
import { DIGITAL_ETHICS_DB } from "@/lib/digitalEthicsDb";
import { SCENARIO_GUIDANCE } from "@/lib/scenarioGuidance";

export default function AssistantDrawer({
  isOpen,
  onClose,
  coachData,
  isLoadingCoach,
  onSelectSuggestedReply,
  currentScenario,
}) {
  if (!isOpen) return null;
  const guidance = SCENARIO_GUIDANCE[currentScenario.id];

  return (
      <aside id="assistant-panel" className="assistant-drawer" aria-label="디지털윤리 상담 도우미">
        {/* 서랍 헤더 */}
        <div className="drawer-header">
          <div className="drawer-title-box">
            <span className="fairy-icon">🧚</span>
            <div>
              <h3>디지털윤리 상담 도우미</h3>
              <p>사이버폭력 응대 연습 가이드</p>
            </div>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            title="도우미 닫기"
          >
            ✕
          </button>
        </div>

        {/* 서랍 본문 */}
        <div className="drawer-content">
          {guidance && (
            <section className="coach-card guidance-card" aria-label={`${currentScenario.name}의 피해와 대응 정보`}>
              <div className="card-tag">📖 {currentScenario.name}의 피해 상황</div>
              <p className="card-body-text">{guidance.details}</p>
              <div className="guidance-divider" />
              <h4>미리 예방하려면</h4>
              <ul>{guidance.prevention.map((item) => <li key={item}>{item}</li>)}</ul>
              <h4>피해가 발생했다면</h4>
              <ul>{guidance.response.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          )}
          {coachData?.feedback && (
            <div className="coach-card" aria-live="polite">
              <div className="card-tag">최근 응대 평가 · {coachData.turn_delta > 0 ? "+" : ""}{coachData.turn_delta}점</div>
              <p className="card-body-text">{coachData.feedback}</p>
              {coachData.evidence && <p style={{ fontSize: "11px", color: "#666" }}>평가한 말: “{coachData.evidence}”</p>}
            </div>
          )}
          {/* 1. 현재 피해 친구의 심리 진단 */}
          <div className="coach-card">
            <div className="card-tag">
              <span>❤️</span>
              <span>현재 {currentScenario.name}의 심리 상태</span>
            </div>
            <div className="card-body-text">
              {isLoadingCoach ? (
                <p style={{ color: "#888" }}>친구의 마음을 분석하는 중입니다...</p>
              ) : (
                <strong>{coachData?.current_emotion || "불안과 두려움에 떨고 있음"}</strong>
              )}
            </div>
          </div>

          {/* 2. 응대 코칭 팁 */}
          <div className="coach-card">
            <div className="card-tag">
              <span>💡</span>
              <span>상담자 코칭 팁 (어떻게 말할까?)</span>
            </div>
            <div className="card-body-text" style={{ lineHeight: "1.55" }}>
              {isLoadingCoach ? (
                <p style={{ color: "#888" }}>상담 조언을 불러오는 중입니다...</p>
              ) : (
                coachData?.advice_tip ||
                "친구에게 '네 탓이 아니야'라고 안심시켜 준 뒤, 단톡방 화면을 캡처하고 선생님께 알리도록 안내해 주세요."
              )}
            </div>
          </div>

          {/* 3. 상황별 추천 답변 3선 (원클릭 자동 입력) */}
          <div className="coach-card" style={{ background: "#FFFDF0", borderColor: "#FEE500" }}>
            <div className="card-tag" style={{ color: "#3A1D1D" }}>
              <span>✨</span>
              <span>추천 답변 3선 (클릭 시 입력창에 쏙!)</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {isLoadingCoach ? (
                <p style={{ color: "#888", fontSize: "12px", padding: "10px" }}>
                  상황에 알맞은 답변을 추천하고 있어요...
                </p>
              ) : (
                coachData?.suggested_replies?.map((reply, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="suggested-reply-btn"
                    onClick={() => {
                      onSelectSuggestedReply(reply);
                    }}
                  >
                    <span className="arrow-badge">👉</span>
                    <span>{reply}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 4. 교육용 대처 수칙 요약 */}
          <div className="coach-card">
            <div className="card-tag">
              <span>🛡️</span>
              <span>도움이 되는 대처 수칙</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              {DIGITAL_ETHICS_DB.actionRules.map((rule) => (
                <div key={rule.step} style={{ borderBottom: "1px solid #F0F0F0", paddingBottom: "6px" }}>
                  <strong style={{ color: "#18868A" }}>{rule.step}. {rule.title}</strong>
                  <p style={{ color: "#555", marginTop: "2px", fontSize: "11.5px" }}>{rule.action}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 5. 긴급 도움 지원처 */}
          <div className="coach-card" style={{ background: "#E8F7F5", borderColor: "#A5E1DC" }}>
            <div className="card-tag">
              <span>📞</span>
              <span>긴급 도움 센터</span>
            </div>
            <p style={{ fontSize: "12px", color: "#18868A", lineHeight: "1.4" }}>
              • <strong>117 학교폭력 신고센터</strong> (전화/문자 #0117)<br />
              • <strong>청소년상담 1388</strong> (24시간 무료 상담)<br />
              • <strong>교내 Wee클래스 / 담임선생님</strong>
            </p>
          </div>
        </div>
      </aside>
  );
}
