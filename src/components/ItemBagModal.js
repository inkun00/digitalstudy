"use client";

import Image from "next/image";
import { FANTASY_ITEMS } from "@/lib/fantasyItems";
import { MAX_ITEM_BONUS_PER_FRIEND } from "@/lib/heartShop";
import { getGiftRelevance } from "@/lib/giftRelevance";

export default function ItemBagModal({ isOpen, onClose, wallet, currentScenario, currentComfort, onGiftItem, onOpenShop, notice }) {
  if (!isOpen) return null;
  const items = FANTASY_ITEMS.filter((item) => wallet.bag[item.id]);
  const applied = wallet.scenarioBoosts[currentScenario.id] || 0;

  return <div className="modal-overlay" onClick={onClose}>
    <div className="modal-box bag-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={`${currentScenario.name}에게 선물하기`}>
      <div className="modal-header"><h3>✨ {currentScenario.name}에게 선물하기</h3><button type="button" className="modal-close-btn" onClick={onClose} aria-label="가방 닫기">✕</button></div>
      <div className="modal-body">
        <p className="bag-modal-intro">선물의 속성이 {currentScenario.name}의 피해 상황과 잘 맞을 때만 안정도가 올라가요. 관련 없는 선물도 전달되며, 친구별 선물 효과는 최대 {MAX_ITEM_BONUS_PER_FRIEND}점이에요.</p>
        <p className="bag-modal-progress">아이템 효과 {applied} / {MAX_ITEM_BONUS_PER_FRIEND}점</p>
        {notice && <p className="bag-modal-notice" role="status">{notice}</p>}
        {items.length ? <div className="bag-modal-list">{items.map((item) => {
          const relevance = getGiftRelevance(item, currentScenario.id);
          const effectHint = !relevance.matched ? "이 친구와는 연관성이 낮아 안정도 변화 없음"
            : applied >= MAX_ITEM_BONUS_PER_FRIEND || currentComfort >= 100 ? "이 친구는 지금 선물 효과 한도에 도달했어요"
              : "✓ 이 친구에게 맞는 선물";
          return <div className="bag-modal-item" key={item.id}>
          <Image src={item.image} alt="" width={62} height={62} sizes="62px" />
          <div><strong>{item.name} <small>×{wallet.bag[item.id]}</small></strong><p>{item.effect}</p><span>{relevance.focusLabel} · 기본 안정도 +{item.boost}</span><small className="bag-modal-effect-hint">{effectHint}</small></div>
          <button type="button" onClick={() => onGiftItem(item.id)}>선물</button>
        </div>})}</div> : <div className="bag-modal-empty"><p className="shop-empty">가방이 비어 있어요. 상점에서 선물을 골라 주세요.</p><button type="button" onClick={onOpenShop}>하트 상점으로 가기</button></div>}
      </div>
    </div>
  </div>;
}
