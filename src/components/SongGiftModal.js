"use client";

import React, { useState } from "react";

export default function SongGiftModal({ isOpen, onClose, onSend, isSending, error, currentScenario }) {
  const [file, setFile] = useState(null);
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={isSending ? undefined : onClose}>
      <div className="modal-box song-gift-modal" role="dialog" aria-modal="true" aria-label={`${currentScenario.name}에게 노래 선물하기`} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>🎵 {currentScenario.name}에게 노래 선물하기</h3>
          <button type="button" className="modal-close-btn" onClick={onClose} disabled={isSending} aria-label="노래 선물 닫기">✕</button>
        </div>
        <div className="song-gift-body">
          <p>{currentScenario.name}에게 희망을 주는 노래를 만들어서 선물해 주세요.</p>
          <label className="song-gift-file-label" htmlFor="song-gift-pdf">노래 PDF 선택</label>
          <input id="song-gift-pdf" type="file" accept=".pdf,application/pdf" disabled={isSending} onChange={(event) => setFile(event.target.files?.[0] || null)} />
          {file && <p className="song-gift-selected">📄 {file.name} · {Math.ceil(file.size / 1024)}KB</p>}
          {error && <p className="song-gift-error" role="alert">{error}</p>}
          <button type="button" className="song-gift-submit" onClick={() => onSend(file)} disabled={!file || isSending}>
            {isSending ? "악보를 읽고 선물하는 중…" : "노래 선물 보내기"}
          </button>
        </div>
      </div>
    </div>
  );
}
