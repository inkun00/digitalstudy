"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredProfile } from "@/lib/userProfile";
import { FANTASY_CATEGORIES, FANTASY_ITEMS, GIFT_FOCUS_LABELS } from "@/lib/fantasyItems";
import { SHOP_ITEMS, equipShopItem, purchaseFantasyItem, purchaseShopItem, useHeartWallet } from "@/lib/heartShop";
import AppBottomNav from "@/components/AppBottomNav";
import { useCloudSession } from "@/components/CloudSyncProvider";

const CATEGORY_COLORS = ["#fff2cd", "#e9e5ff", "#dff4ec", "#ffe8dc", "#e0effc"];

export default function ShopPage() {
  const router = useRouter();
  const wallet = useHeartWallet();
  const { status, user, profile } = useCloudSession();
  const [tab, setTab] = useState("fantasy");
  const [category, setCategory] = useState("all");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (status !== "ready") return;
    if (!user || user.isAnonymous) router.replace("/");
    else if (!profile && !getStoredProfile()) router.replace("/my");
  }, [profile, router, status, user]);

  const visibleItems = category === "all" ? FANTASY_ITEMS : FANTASY_ITEMS.filter((item) => item.categoryId === category);
  const bagItems = FANTASY_ITEMS.filter((item) => wallet.bag[item.id]);

  const handleTheme = (item) => {
    const result = wallet.owned.includes(item.id)
      ? { message: equipShopItem(item.id) ? `${item.name} 배경을 적용했어요!` : "배경을 적용하지 못했어요." }
      : purchaseShopItem(item.id);
    setNotice(result.message);
  };

  return (
    <main className="app-container shop-page">
      <header className="shop-header">
        <div className="shop-header-top">
          <h1>하트 상점</h1>
          <span className="shop-header-balance" aria-label={`보유 하트 ${wallet.balance}포인트`}>♥ {wallet.balance}</span>
        </div>
        <nav className="shop-tabs" aria-label="상점 보기">
          <button type="button" className={tab === "fantasy" ? "active" : ""} onClick={() => setTab("fantasy")}>마법 아이템</button>
          <button type="button" className={tab === "themes" ? "active" : ""} onClick={() => setTab("themes")}>채팅 배경</button>
          <button type="button" className={tab === "bag" ? "active" : ""} onClick={() => setTab("bag")}>내 가방 <span>{Object.values(wallet.bag).reduce((sum, count) => sum + count, 0)}</span></button>
        </nav>
      </header>

      <div className="shop-scroll-area">
        {tab === "fantasy" && <>
          <section className="shop-hero-banner fantasy-hero">
            <div><span className="shop-hero-kicker">H.E.A.R.T FANTASY</span><h2>마음에 작은 마법을<br />선물해요</h2><p>따뜻한 대화로 모은 하트로 아이템을 골라 보세요.</p></div>
            <span className="shop-hero-heart" aria-hidden="true">♥</span>
          </section>
          <div className="shop-wallet-card"><span>내 하트 포인트</span><strong>♥ {wallet.balance}</strong><small>누적 적립 {wallet.totalEarned}P</small></div>
          <section className="fantasy-catalog" aria-label="마법 아이템 목록">
            <div className="shop-section-heading"><div><span className="shop-section-eyebrow">ORIGINAL STORY ITEMS</span><h2>마음을 돌보는 물건들</h2></div><span>{visibleItems.length}개</span></div>
            <div className="fantasy-category-strip" role="group" aria-label="아이템 종류">
              <button type="button" className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>전체 100</button>
              {FANTASY_CATEGORIES.map((group) => <button type="button" key={group.id} className={category === group.id ? "active" : ""} onClick={() => setCategory(group.id)}>{group.label}</button>)}
            </div>
            <div className="fantasy-grid">
              {visibleItems.map((item) => <article className="fantasy-product" key={item.id}>
                <div className="fantasy-product-art" style={{ background: CATEGORY_COLORS[FANTASY_CATEGORIES.findIndex((group) => group.id === item.categoryId)] }}>
                  <Image src={item.image} alt={item.name} width={190} height={190} sizes="(max-width: 480px) 42vw, 190px" />
                </div>
                <div className="fantasy-product-info">
                  <span className="fantasy-product-category">{item.category}</span>
                  <h3>{item.name}</h3>
                  <p className="fantasy-description">{item.description}</p>
                  <div className="fantasy-effect"><strong>기본 안정도 +{item.boost} · {GIFT_FOCUS_LABELS[item.focus]}</strong><span>{item.effect} 피해 상황과 맞을 때 효과가 적용돼요.</span></div>
                  <button type="button" onClick={() => setNotice(purchaseFantasyItem(item.id).message)}>♥ {item.price} · 구매하기</button>
                </div>
              </article>)}
            </div>
          </section>
        </>}

        {tab === "themes" && <section className="shop-section" aria-label="채팅방 배경 상품">
          <div className="shop-section-heading"><div><span className="shop-section-eyebrow">FOR MY CHAT</span><h2>채팅방을 꾸며 보세요</h2></div><span>{SHOP_ITEMS.length}개</span></div>
          <div className="shop-grid">
            {SHOP_ITEMS.map((item) => <article className="shop-product" key={item.id}>
              <div className="shop-product-preview" style={{ background: item.background }}><span className="shop-product-icon" aria-hidden="true">{item.icon}</span><span className="shop-preview-bubble one" aria-hidden="true" /><span className="shop-preview-bubble two" aria-hidden="true" /></div>
              <div className="shop-product-info"><span className="shop-product-category">채팅방 배경</span><h3>{item.name}</h3><p>{item.description}</p><button type="button" className={`shop-product-action ${wallet.equipped === item.id ? "equipped" : ""}`} onClick={() => handleTheme(item)} disabled={wallet.equipped === item.id}>{wallet.equipped === item.id ? "사용 중" : wallet.owned.includes(item.id) ? "적용하기" : <>♥ {item.price} · 구매하기</>}</button></div>
            </article>)}
          </div>
        </section>}

        {tab === "bag" && <section className="shop-section bag-section" aria-label="보유 아이템">
          <div className="shop-section-heading"><div><span className="shop-section-eyebrow">MY INVENTORY</span><h2>내 가방</h2></div><span>{bagItems.length}종</span></div>
          <p className="bag-intro">마법 아이템은 친구와의 채팅방에서 가방 버튼을 눌러 사용할 수 있어요. 피해 상황과 선물 속성이 잘 맞아야 안정도에 적용돼요.</p>
          {bagItems.length ? <div className="bag-list">{bagItems.map((item) => <div className="bag-item" key={item.id}><Image src={item.image} alt="" width={66} height={66} sizes="66px" /><div><strong>{item.name} <small>×{wallet.bag[item.id]}</small></strong><p>{item.effect}</p><span>{GIFT_FOCUS_LABELS[item.focus]} · 기본 안정도 +{item.boost}</span></div></div>)}</div> : <p className="shop-empty">아직 마법 아이템이 없어요. 대화로 하트를 모아 아이템을 골라 보세요.</p>}
          <Link className="bag-chat-link" href="/chat">대화할 친구 고르기 →</Link>
          <div className="bag-theme-heading"><h3>보유한 채팅 배경</h3><span>{wallet.owned.length}개</span></div>
          <button type="button" className="shop-default-theme" onClick={() => setNotice(equipShopItem("default") ? "기본 배경을 적용했어요!" : "배경을 적용하지 못했어요.")}>기본 채팅방 배경 사용하기 {wallet.equipped === "default" && <strong>사용 중</strong>}</button>
          {SHOP_ITEMS.filter((item) => wallet.owned.includes(item.id)).map((item) => <button type="button" className="bag-theme-item" key={item.id} onClick={() => handleTheme(item)}><span style={{ background: item.background }}>{item.icon}</span>{item.name}<strong>{wallet.equipped === item.id ? "사용 중" : "적용하기"}</strong></button>)}
        </section>}
        <p className="shop-disclaimer">가상 아이템 상점입니다. 실제 결제나 실물 배송은 없어요. 아이템의 회복 효과는 교육용 게임 수치입니다.</p>
      </div>

      {notice && <div className="shop-notice" role="status" aria-live="polite">{notice}<button type="button" onClick={() => setNotice("")} aria-label="알림 닫기">×</button></div>}
      <AppBottomNav active="shop" />
    </main>
  );
}
