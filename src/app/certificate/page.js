"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCloudSession } from "@/components/CloudSyncProvider";
import { CERTIFICATE_TIERS } from "@/lib/certificate";
import { useCertificateProgress } from "@/lib/useCertificateProgress";

const TIER_SYMBOLS = ["✦", "✧", "◆", "✷", "♛"];

export default function CertificatePage() {
  const router = useRouter();
  const { status, user, profile } = useCloudSession();
  const progress = useCertificateProgress();

  useEffect(() => {
    if (status === "ready" && (!user || user.isAnonymous)) router.replace("/");
  }, [router, status, user]);

  if (status === "loading") return <main className="ending-loading" role="status">수료증을 준비하고 있어요…</main>;

  return <main className="certificate-page">
    <header className="certificate-topbar"><Link href="/my" aria-label="마이 페이지로 돌아가기">←</Link><span>명예상담사 수료증</span><span aria-hidden="true">♥</span></header>
    <div className="certificate-content">
      {!progress.issued ? <section className="certificate-locked">
        <span className="certificate-locked-icon" aria-hidden="true">♡</span>
        <p className="certificate-kicker">H.E.A.R.T PROJECT</p>
        <h1>첫 수료증을 기다리고 있어요</h1>
        <p>친구의 이야기를 듣고 마음 안정도 70점부터 직접 만든 노래를 선물해 보세요. 친구의 감사 답장과 엔딩이 열리면 첫 수료증을 받을 수 있어요.</p>
        <Link href="/chat">친구 만나러 가기 →</Link>
      </section> : <>
        <p className="certificate-intro">친구들과 나눈 대화와 노래 선물로 얻은 현재 등급이에요. 활동 기록이 늘면 수료증도 올라갑니다.</p>
        <section className={`certificate-sheet certificate-tier-${progress.tier.level}`} aria-label={`${progress.tier.name} 명예상담사 수료증`}>
          <div className="certificate-border">
            <span className="certificate-corner certificate-corner-tl" aria-hidden="true">✦</span>
            <span className="certificate-corner certificate-corner-tr" aria-hidden="true">✦</span>
            <span className="certificate-corner certificate-corner-bl" aria-hidden="true">✦</span>
            <span className="certificate-corner certificate-corner-br" aria-hidden="true">✦</span>
            <div className="certificate-brand"><span>♥</span> H.E.A.R.T PROJECT <span>♥</span></div>
            <p className="certificate-kicker">CYBER HEART COUNSELING</p>
            <div className="certificate-medal" aria-hidden="true"><span>{TIER_SYMBOLS[progress.tier.level - 1]}</span></div>
            <p className="certificate-badge">TIER {progress.tier.level} · {progress.tier.badge}</p>
            <h1>명예상담사 수료증</h1>
            <p className="certificate-recipient-label">이 수료증을</p>
            <strong className="certificate-recipient">{profile?.name || "상담자"} 님</strong>
            <p className="certificate-message">께 드립니다. 친구의 어려운 이야기를 듣고 마음을 돌보는 대화를 나누었으며, 직접 만든 노래로 희망을 전했습니다.</p>
            <div className="certificate-tier-name">{progress.tier.name}</div>
            <div className="certificate-stars" aria-label={`${progress.tier.level}등급`}>{Array.from({ length: progress.tier.level }, (_, index) => <span key={index}>✦</span>)}</div>
            <div className="certificate-achievements">
              <div><span>상담한 친구</span><strong>{progress.counseled}<small>명</small></strong></div>
              <div><span>대화 안정도 상승</span><strong>+{progress.stabilityGain}<small>점</small></strong></div>
              <div><span>완료한 노래 선물</span><strong>{progress.songs}<small>명</small></strong></div>
            </div>
            <p className="certificate-footnote">이 수료증은 H.E.A.R.T 프로젝트의 교육용 활동 기록입니다.</p>
            <div className="certificate-seal"><span>♥</span><small>HEART<br />PROJECT</small></div>
          </div>
        </section>
        <button className="certificate-print" type="button" onClick={() => window.print()}>수료증 PDF로 저장 · 인쇄</button>
      </>}

      <section className="certificate-progress">
        <h2>{progress.nextTier ? "다음 등급까지" : "최고 등급을 달성했어요!"}</h2>
        {progress.nextTier && <p><strong>{progress.nextTier.name}</strong>에는 상담 {progress.nextTier.counseled}명, 대화 안정도 상승 합계 {progress.nextTier.stabilityGain}점, 노래 선물 {progress.nextTier.songs}명이 필요해요.</p>}
        <div className="certificate-progress-stats"><span>상담 {progress.counseled}명</span><span>안정도 +{progress.stabilityGain}점</span><span>노래 {progress.songs}명</span></div>
        <h3>5개 등급 기준</h3>
        <ol>{CERTIFICATE_TIERS.map((tier) => <li key={tier.level} className={progress.tier?.level === tier.level ? "current" : ""}>
          <span>{tier.level}단계 · {tier.name}</span><small>상담 {tier.counseled}명 · 안정도 +{tier.stabilityGain}점 · 노래 {tier.songs}명</small>
        </li>)}</ol>
        <p className="certificate-method">안정도 상승은 각 친구와 대화해 오른 점수를 합산하며, 아이템으로 오른 점수는 제외해요. 노래는 한 명에게 선물해 엔딩을 완료하면 모든 등급의 노래 조건을 충족해요. 같은 가사의 노래는 다른 친구에게 다시 선물할 수 없어요.</p>
      </section>
    </div>
  </main>;
}
