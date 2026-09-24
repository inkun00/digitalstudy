"use client";

import React from "react";

export default function KakaoHeader({
  currentScenario,
  comfortScore,
  heartPoints,
  pointsEarned,
  onOpenScenarioModal,
  onOpenDrawer,
  onOpenBag,
  onOpenShop,
  drawerOpen,
  onBack,
}) {
  return (
    <header className="kakao-header">
      <div className="header-top-row">
        <button type="button" className="header-back" onClick={onBack} aria-label="대화 상대 목록으로 돌아가기" title="대화 상대 목록">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 4-8 8 8 8" /></svg>
        </button>
        <button type="button" className="profile-section" onClick={onOpenScenarioModal} title="다른 친구 사연 선택">
          <span className="friend-name">{currentScenario.name}</span><span className="header-room-count">1</span>
        </button>

        <div className="header-actions">
          <button type="button" className="icon-btn" onClick={onOpenBag} aria-label="내 아이템 가방 열기" title="내 아이템"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16v11H4V9Zm4 0V7a4 4 0 0 1 8 0v2M4 14h16" /></svg></button>
          <button type="button" className={`icon-btn ${drawerOpen ? "active" : ""}`} onClick={onOpenDrawer} aria-label={drawerOpen ? "도우미 닫기" : "도우미 열기"} aria-controls="assistant-panel" aria-expanded={drawerOpen} title="상담 도우미"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5m0-8h.01" /></svg></button>
          <button type="button" className="icon-btn" onClick={onOpenShop} aria-label="하트 상점 열기" title="하트 상점"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16l-1 11H5L4 9Zm3 0V7a5 5 0 0 1 10 0v2" /></svg></button>
        </div>
      </div>

      <div className="comfort-meter-bar">
        <span className="meter-label">마음 안정도 <small>교육용 추정</small></span>
        <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, comfortScore))}%` }} /></div>
        <strong className="meter-score">{comfortScore}%</strong>
        <button type="button" className="meter-points" onClick={onOpenShop} title="하트 상점 열기">♥ {heartPoints}{pointsEarned > 0 && <small>+{pointsEarned}</small>}</button>
      </div>
    </header>
  );
}
