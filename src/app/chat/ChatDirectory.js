"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SCENARIOS } from "@/lib/scenarios";
import { getStoredProfile } from "@/lib/userProfile";
import { useHeartWallet } from "@/lib/heartShop";
import AppBottomNav from "@/components/AppBottomNav";
import { useCloudSession } from "@/components/CloudSyncProvider";

export default function ChatDirectory() {
  const router = useRouter();
  const wallet = useHeartWallet();
  const { status, user, profile, openingCompleted } = useCloudSession();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (status !== "ready") return;
    if (!user || user.isAnonymous) router.replace("/");
    else if (!profile && !getStoredProfile()) router.replace("/my");
    else if (!openingCompleted) router.replace("/opening");
  }, [openingCompleted, profile, router, status, user]);

  const filteredScenarios = SCENARIOS.filter((scenario) =>
    `${scenario.name} ${scenario.grade} ${scenario.tag} ${scenario.storyBrief}`.toLocaleLowerCase("ko").includes(query.trim().toLocaleLowerCase("ko"))
  );

  return (
    <main className="app-container chat-directory">
      <header className="directory-header">
        <div className="directory-title-row">
          <div>
            <span className="directory-eyebrow">H.E.A.R.T PROJECT</span>
            <h1>채팅</h1>
          </div>
          <div className="directory-header-actions">
            <Link className="directory-wallet-link" href="/shop" aria-label={`하트 상점, 보유 포인트 ${wallet.balance}`}>♥ {wallet.balance}</Link>
            <Link className="directory-profile-link" href="/my" aria-label="마이 페이지" title="마이 페이지">
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.4-3.7 2.8-5.7 7-5.7s6.6 2 7 5.7" /></svg>
            </Link>
          </div>
        </div>
        <p>이야기를 나눌 친구를 선택해 주세요.</p>
        <label className="directory-search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.2" /><path d="m15.4 15.4 5 5" /></svg>
          <span className="sr-only">친구 또는 피해 상황 검색</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="친구 또는 피해 상황 검색" />
        </label>
      </header>

      <section className="directory-list" aria-label="대화 상대 목록">
        <div className="directory-list-heading">
          <h2>대화할 친구</h2>
          <span>{filteredScenarios.length}명</span>
        </div>
        {filteredScenarios.length ? filteredScenarios.map((scenario) => (
          <Link className="directory-chat-row" href={`/chat?scenario=${encodeURIComponent(scenario.id)}`} key={scenario.id}>
            <Image className="directory-avatar" src={scenario.avatar} alt="" width={56} height={56} sizes="56px" />
            <span className="directory-chat-copy">
              <span className="directory-chat-name">{scenario.name} <small>{scenario.grade}</small></span>
              <span className="directory-chat-status">{scenario.statusMessage}</span>
              <span className="directory-chat-tag">{scenario.tag}</span>
            </span>
            <svg className="directory-row-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </Link>
        )) : <p className="directory-empty">검색 결과가 없어요. 다른 이름이나 피해 상황을 입력해 보세요.</p>}
      </section>
      <AppBottomNav active="chat" />
    </main>
  );
}
