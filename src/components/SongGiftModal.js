"use client";

import React, { useState } from "react";
import { MAX_SONG_PAGES, MAX_SONG_PDF_BYTES, SONG_GIFT_MIN_COMFORT } from "@/lib/songGiftConfig";

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
          <p>직접 만든 노래의 악보 PDF를 올려 주세요. 표준 양식과 가사를 확인한 뒤 {currentScenario.name}가 답장할 수 있어요.</p>
          <label className="song-gift-file-label" htmlFor="song-gift-pdf">악보 PDF 선택</label>
          <input id="song-gift-pdf" type="file" accept=".pdf,application/pdf" disabled={isSending} onChange={(event) => setFile(event.target.files?.[0] || null)} />
          {file && <p className="song-gift-selected">📄 {file.name} · {Math.ceil(file.size / 1024)}KB</p>}
          <p className="song-gift-hint">표준 양식: A4 {MAX_SONG_PAGES}쪽에 제목, 이야기 상자, QR 코드, 네 줄의 오선보와 가사가 있어야 해요. {Math.round(MAX_SONG_PDF_BYTES / 1024)}KB 이하 PDF를 올려 주세요.</p>
          <p className="song-gift-hint">편지와 가사를 읽기 위해 페이지 이미지가 하이퍼클로바X로 전송됩니다. 가사가 위로 또는 사이버폭력 예방·대처와 관계없으면 친구가 답하지 않아요.</p>
          <p className="song-gift-hint">마음 안정도 {SONG_GIFT_MIN_COMFORT}점부터 노래를 받아들여요. 노래 선물 자체는 안정도 점수를 올리지 않아요.</p>
          {error && <p className="song-gift-error" role="alert">{error}</p>}
          <button type="button" className="song-gift-submit" onClick={() => onSend(file)} disabled={!file || isSending}>
            {isSending ? "악보를 읽고 선물하는 중…" : "노래 선물 보내기"}
          </button>
        </div>
      </div>
    </div>
  );
}
