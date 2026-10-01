"use client";

import React, { useEffect, useRef, useState } from "react";
import { conversationCsv, conversationPlainText } from "@/lib/conversationExport";

export default function ConversationExportModal({ isOpen, onClose, messages, currentScenario }) {
  const [notice, setNotice] = useState("");
  const closeRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(conversationPlainText(messages, currentScenario.name));
      setNotice("대화 내용을 클립보드에 복사했어요.");
    } catch {
      setNotice("복사하지 못했어요. 브라우저의 클립보드 권한을 확인해 주세요.");
    }
  };

  const handleDownload = () => {
    try {
      const blob = new Blob([conversationCsv(messages, currentScenario.name)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${currentScenario.id}-대화내용-${new Date().toLocaleDateString("sv-SE")}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setNotice("CSV 파일을 저장했어요.");
    } catch {
      setNotice("CSV 파일을 만들지 못했어요. 다시 시도해 주세요.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box conversation-export-modal" role="dialog" aria-modal="true" aria-labelledby="conversation-export-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3 id="conversation-export-title">대화 내용 복사하기</h3>
          <button ref={closeRef} type="button" className="modal-close-btn" onClick={onClose} aria-label="닫기">✕</button>
        </div>
        <div className="conversation-export-body">
          <p>{currentScenario.name}와의 채팅방에 저장된 대화를 어떤 방식으로 가져갈까요?</p>
          <button type="button" onClick={handleCopy}>📋 클립보드에 복사</button>
          <button type="button" onClick={handleDownload}>📄 CSV 파일로 저장</button>
          {notice && <p className="conversation-export-notice" role="status">{notice}</p>}
        </div>
      </div>
    </div>
  );
}
