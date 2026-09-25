"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { FANTASY_ITEMS } from "@/lib/fantasyItems";

function AvatarButton({ scenario, onOpen }) {
  return (
    <button
      type="button"
      className="msg-avatar-button"
      aria-label={`${scenario.name} 프로필 사진 크게 보기`}
      onClick={onOpen}
    >
      <Image
        src={scenario.avatar}
        alt=""
        width={39}
        height={39}
        sizes="39px"
        className="msg-avatar"
      />
    </button>
  );
}

export default function ChatList({ messages, isTyping, currentScenario, onDownloadSongPdf }) {
  const bottomRef = useRef(null);
  const closeButtonRef = useRef(null);
  const openedFromRef = useRef(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const openProfile = (event) => {
    openedFromRef.current = event.currentTarget;
    setIsProfileOpen(true);
  };

  const closeProfile = () => {
    setIsProfileOpen(false);
    openedFromRef.current?.focus();
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!isProfileOpen) return;

    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
        openedFromRef.current?.focus();
      } else if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isProfileOpen]);

  return (
    <>
    <div className="chat-area">
      {/* 날짜 구분선 */}
      <div className="date-divider">
        <span className="date-text">2026년 9월 23일 수요일</span>
      </div>

      {/* 사연 안내 카드 */}
      <div className="system-notice-box">
        <strong>[상담 의뢰 사연]</strong> {currentScenario.storyBrief}
        <br />
        💡 <em>상담자로서 친구의 아픔에 공감하고, 안전한 대처 수칙을 안내해 주세요.</em>
      </div>

      {/* 메시지 리스트 */}
      {messages.map((msg) => {
        if (msg.sender === "system") {
          if (msg.songGift) return <article key={msg.id} className="song-gift-card" aria-label={`${currentScenario.name}에게 보낸 노래 ${msg.songGift.title}`}>
            <div className="gift-message-heading"><span>🎵 노래 선물</span><small>{currentScenario.name}에게 보냈어요</small></div>
            <div className="song-gift-card-art"><span aria-hidden="true">♫</span><strong>{msg.songGift.title}</strong><small>직접 만든 노래 · 악보 PDF</small></div>
            <div className="song-gift-card-details">
              {msg.songGift.letter && <p><strong>편지</strong>{msg.songGift.letter}</p>}
              {msg.songGift.lyrics && <details><summary>가사 보기</summary><p>{msg.songGift.lyrics}</p></details>}
              <button type="button" onClick={() => onDownloadSongPdf(msg.songGift.fileId)}>📄 악보 PDF 내려받기</button>
            </div>
            <div className="gift-message-footer"><strong>노래 선물 완료</strong><time>{msg.time}</time></div>
          </article>;
          const gift = FANTASY_ITEMS.find((item) => item.id === msg.giftItemId);
          if (gift) return <article key={msg.id} className="gift-message-card" aria-label={`${currentScenario.name}에게 보낸 선물 ${gift.name}`}>
            <div className="gift-message-heading"><span>🎁 선물하기</span><small>{currentScenario.name}에게 보냈어요</small></div>
            <div className="gift-message-art"><Image src={gift.image} alt={gift.name} width={180} height={180} sizes="180px" className="gift-message-image" /></div>
            <div className="gift-message-details"><strong>{gift.name}</strong><p>{gift.description}</p><span>{gift.effect}</span></div>
            {Number.isSafeInteger(msg.giftBoost) && msg.giftBoost > 0 && <div className="gift-message-effect">♥ 마음 안정도 +{msg.giftBoost}</div>}
            {msg.giftBoost === 0 && <div className="gift-message-effect">마음 안정도 변화 없음 · {msg.giftMatched === false ? "피해 상황과 연관성이 낮아요" : "현재 효과 한도에 도달했어요"}</div>}
            <div className="gift-message-footer"><strong>선물 전달 완료</strong><time>{msg.time}</time></div>
          </article>;
          return <div key={msg.id} className="item-system-message">{msg.text}</div>;
        }
        const isUser = msg.sender === "user";
        return (
          <div key={msg.id} className={`message-row ${isUser ? "user" : "victim"}`}>
            {!isUser && (
              <AvatarButton scenario={currentScenario} onOpen={openProfile} />
            )}
            <div className="message-content-wrap">
              {!isUser && <span className="msg-sender-name">{currentScenario.name}</span>}
              <div className="bubble-with-meta">
                <div className={`message-bubble ${isUser ? "user" : "victim"}`}>
                  {msg.text}
                </div>
                <div className="meta-info">
                  {isUser && msg.unread && <span className="unread-count">1</span>}
                  <span className="msg-time">{msg.time}</span>
                </div>
              </div>
              {isUser && msg.evaluation && (
                <div className={`message-evaluation ${msg.evaluation.turn_delta < 0 ? "negative" : ""}`}>
                  안정도 {msg.evaluation.turn_delta > 0 ? "+" : ""}{msg.evaluation.turn_delta} · {msg.evaluation.feedback}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* 상대방 입력 중 인디케이터 */}
      {isTyping && (
        <div className="message-row victim">
          <AvatarButton scenario={currentScenario} onOpen={openProfile} />
          <div className="message-content-wrap">
            <span className="msg-sender-name">{currentScenario.name}</span>
            <div className="message-bubble victim typing-indicator">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
    {isProfileOpen && createPortal(
      <div className="profile-viewer" role="dialog" aria-modal="true" aria-labelledby="profile-viewer-title">
        <button
          type="button"
          className="profile-viewer-backdrop"
          aria-label="프로필 사진 닫기"
          tabIndex={-1}
          onClick={closeProfile}
        />
        <button
          ref={closeButtonRef}
          type="button"
          className="profile-viewer-close"
          aria-label="프로필 사진 닫기"
          onClick={closeProfile}
        >
          <span aria-hidden="true">×</span>
        </button>
        <div className="profile-viewer-content">
          <Image
            src={currentScenario.avatar}
            alt={`${currentScenario.name} 프로필 사진`}
            width={600}
            height={600}
            sizes="(max-width: 600px) 100vw, 600px"
            className="profile-viewer-image"
            priority
          />
          <h2 id="profile-viewer-title" className="profile-viewer-name">{currentScenario.name}</h2>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
