"use client";

import React, { useState } from "react";

export default function ChatInput({
  onSendMessage,
  isTyping,
  turnCount,
  comfortScore,
  onOpenReportModal,
  inputValue,
  setInputValue,
  onOpenDrawer,
  onOpenGift,
}) {
  const [isComposing, setIsComposing] = useState(false);
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  const handleSend = () => {
    if (!inputValue.trim() || isTyping) return;
    onSendMessage(inputValue.trim());
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    // 한국어 IME 한글 입력 중복 방지
    if (isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 5턴 이상 대화 진행 시 리포트 발행 활성화
  const canGenerateReport = turnCount >= 5 || comfortScore >= 75;

  return (
    <div className="chat-input-area">
      {/* 5턴 이상 또는 안정도 달성 시 나타나는 성과 리포트 배너 버튼 */}
      {canGenerateReport && (
        <button
          type="button"
          className="report-banner-btn"
          onClick={onOpenReportModal}
          disabled={isTyping}
        >
          <span>{comfortScore >= 75 ? "친구의 마음 안정도가 높아졌어요" : "지금까지의 응대를 돌아보세요"}</span>
          <strong>[대화 평가 리포트 & 노랫말 처방전] ➔</strong>
        </button>
      )}

      {isQuickMenuOpen && <div className="input-quick-menu">
        <button type="button" onClick={() => { setIsQuickMenuOpen(false); onOpenGift(); }}>🎁 선물하기</button>
        <button type="button" onClick={() => { setIsQuickMenuOpen(false); onOpenDrawer(); }}>상담 도우미</button>
        {canGenerateReport && <button type="button" onClick={() => { setIsQuickMenuOpen(false); onOpenReportModal(); }}>대화 평가 리포트</button>}
      </div>}
      <div className="input-row">
        <button type="button" className="plus-btn" title="더보기" aria-label="더보기" aria-expanded={isQuickMenuOpen} onClick={() => setIsQuickMenuOpen((value) => !value)}>
          +
        </button>

        <textarea
          className="chat-input"
          placeholder="메시지 입력"
          rows={1}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          disabled={isTyping}
        />

        <button
          type="button"
          className="send-btn"
          onClick={handleSend}
          disabled={!inputValue.trim() || isTyping}
          title="전송"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
