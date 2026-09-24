"use client";

import React, { useRef, useState } from "react";
import { LYRICS_GENERATION_COST, refundHeartPoints, spendHeartPoints, useHeartWallet } from "@/lib/heartShop";

export default function ReportModal({
  isOpen,
  onClose,
  reportData,
  isLoadingReport,
  reportError,
  currentScenario,
  messages,
}) {
  const [copied, setCopied] = useState(false);
  const [lyricsLines, setLyricsLines] = useState(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const [lyricsError, setLyricsError] = useState("");
  const lyricsInFlight = useRef(false);
  const wallet = useHeartWallet();

  if (!isOpen) return null;

  const handleGenerateLyrics = async () => {
    if (!reportData || lyricsInFlight.current) return;
    lyricsInFlight.current = true;
    const payment = spendHeartPoints(LYRICS_GENERATION_COST);
    if (!payment.ok) {
      setLyricsError(payment.message);
      lyricsInFlight.current = false;
      return;
    }
    setIsLoadingLyrics(true);
    setLyricsError("");
    setCopied(false);
    try {
      const response = await fetch("/api/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: currentScenario.id, messages }),
      });
      if (!response.ok) {
        const failure = await response.json().catch(() => null);
        throw new Error(failure?.error || "예시 가사를 만들지 못했어요.");
      }
      const result = await response.json();
      if (!Array.isArray(result.lines) || result.lines.length !== 4 || result.lines.some((line) =>
        !Array.isArray(line) || line.length !== 4 || line.some((bar) => typeof bar !== "string" || !bar.trim()))) {
        throw new Error("완성된 16마디 가사를 받지 못했어요.");
      }
      setLyricsLines(result.lines);
    } catch (error) {
      const refunded = refundHeartPoints(LYRICS_GENERATION_COST);
      setLyricsError(`${error.message}${refunded ? " 사용한 하트 100포인트를 돌려드렸어요." : " 하트 환불 내역을 저장하지 못했어요."}`);
    } finally {
      setIsLoadingLyrics(false);
      lyricsInFlight.current = false;
    }
  };

  const handleCopyLyrics = async () => {
    if (!lyricsLines) return;
    try {
      await navigator.clipboard.writeText(lyricsLines.map((line) => line.join(" / ")).join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setLyricsError("가사를 복사하지 못했어요. 다시 시도해 주세요.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: "460px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🩺 H.E.A.R.T 사이버 마음 상담 성과 리포트</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {isLoadingReport ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>📊</div>
              <h4 style={{ fontSize: "16px", marginBottom: "6px" }}>
                대화 속 응대와 점수 변화를 분석하고 있습니다...
              </h4>
              <p style={{ fontSize: "12px", color: "#777" }}>
                교육용 마음 안정도 변화와 노랫말 처방전을 정리하고 있습니다.
              </p>
            </div>
          ) : reportError || !reportData ? (
            <p role="alert" style={{ padding: "24px", textAlign: "center" }}>{reportError || "리포트 데이터를 불러오지 못했습니다."}</p>
          ) : (
            <>
              {/* 히어로 배지 */}
              <div className="report-hero">
                <div className="report-badge-icon">💖</div>
                <h4>{currentScenario.name}와의 대화 평가</h4>
                <p>대화에 나타난 응대에 따른 교육용 마음 안정도 추정입니다.</p>
                {reportData.item_bonus > 0 && <p>마법 아이템 효과 +{reportData.item_bonus}점이 포함되어 있어요.</p>}
              </div>

              {/* 점수 변화 카드 */}
              <div className="recovery-score-card">
                <div className="score-box">
                  <div className="label">상담 시작 전</div>
                  <div className="val before">{reportData?.initial_score ?? 25}점</div>
                </div>
                <div className="recovery-arrow">➔</div>
                <div className="score-box">
                  <div className="label">현재 추정 안정도</div>
                  <div className="val after">{reportData?.final_score ?? 25}점</div>
                </div>
              </div>

              {/* 3대 역량 점수 */}
              <div className="skill-metrics">
                <div className="skill-row">
                  <span>🤝 공감 및 정서적 지지</span>
                  <strong style={{ color: "#FF6B6B" }}>{reportData?.empathy_score ?? 0}점</strong>
                </div>
                <div className="skill-row">
                  <span>🔍 사이버폭력 문제 파악도</span>
                  <strong style={{ color: "#18868A" }}>{reportData?.problem_analysis_score ?? 0}점</strong>
                </div>
                <div className="skill-row">
                  <span>🛡️ 5대 대처 솔루션 안내</span>
                  <strong style={{ color: "#10B981" }}>{reportData?.action_solution_score ?? 0}점</strong>
                </div>
              </div>

              {/* 응대 평가 피드백 */}
              <div className="coach-card">
                <div className="card-tag">
                  <span>👩‍🏫</span>
                  <span>응대 평가와 개선 조언</span>
                </div>
                <p className="card-body-text" style={{ fontSize: "12.5px" }}>
                  {reportData?.teacher_feedback}
                </p>
              </div>

              {/* 적용된 솔루션 태그 */}
              <div className="coach-card">
                <div className="card-tag">
                  <span>✅</span>
                  <span>실천 처방 리스트</span>
                </div>
                <ul style={{ paddingLeft: "18px", fontSize: "12px", color: "#444", lineHeight: "1.6" }}>
                  {reportData?.applied_solutions?.map((sol, idx) => (
                    <li key={idx}>{sol}</li>
                  ))}
                </ul>
              </div>

              {/* ★ 2차시 『마음멜로디』 노랫말 처방전 연계 */}
              <div className="lyrics-prescription-card">
                <div className="lyrics-card-title">
                  <span>🎶 2차시 맞춤형 노랫말 처방전</span>
                  {lyricsLines && <button
                    type="button"
                    onClick={handleCopyLyrics}
                    style={{
                      background: copied ? "#10B981" : "#FEE500",
                      color: copied ? "#FFF" : "#3A1D1D",
                      border: "none",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    {copied ? "✓ 복사 완료!" : "📋 가사 복사"}
                  </button>}
                </div>

                <p className="lyrics-description">{currentScenario.name}와 나눈 대화를 바탕으로 4줄, 총 16마디의 예시 가사를 만들어요. 생성할 때마다 하트 {LYRICS_GENERATION_COST}포인트가 소모돼요.</p>
                <p className="lyrics-balance">보유 하트 ♥ {wallet.balance}P</p>
                <button type="button" className="lyrics-generate-btn" onClick={handleGenerateLyrics} disabled={isLoadingLyrics || wallet.balance < LYRICS_GENERATION_COST}>
                  {isLoadingLyrics ? "예시 가사 만드는 중..." : lyricsLines ? `♥ ${LYRICS_GENERATION_COST} · 예시 가사 다시 생성` : `♥ ${LYRICS_GENERATION_COST} · 예시 가사 생성`}
                </button>
                {wallet.balance < LYRICS_GENERATION_COST && !isLoadingLyrics && <p className="lyrics-shortfall">가사를 생성하려면 하트 {LYRICS_GENERATION_COST - wallet.balance}포인트가 더 필요해요.</p>}
                {lyricsError && <p className="lyrics-error" role="alert">{lyricsError}</p>}
                {lyricsLines && <div className="lyrics-lines">
                  {lyricsLines.map((line, lineIndex) => (
                    <div key={lineIndex} className="lyrics-item">
                      <strong>{lineIndex + 1}줄</strong>
                      <div className="lyrics-bars">{line.map((bar, barIndex) => <span key={barIndex}><small>{lineIndex * 4 + barIndex + 1}마디</small>{bar}</span>)}</div>
                    </div>
                  ))}
                </div>}

                {lyricsLines && <a
                  href="https://maeum-melody.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="goto-music-btn"
                >
                  <span>🎹</span>
                  <span>『마음멜로디』로 희망의 노래 만들러 가기 ➔</span>
                </a>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
