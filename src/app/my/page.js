"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { accountErrorMessage, logoutAccount, saveAccountProfile } from "@/lib/account";
import { normalizeUserProfile } from "@/lib/userProfile";
import { useHeartWallet } from "@/lib/heartShop";
import { useCloudSession } from "@/components/CloudSyncProvider";
import AppBottomNav from "@/components/AppBottomNav";
import ProfileFields from "@/components/ProfileFields";

const EMPTY_PROFILE = { name: "", gender: "", age: "" };

export default function MyPage() {
  const router = useRouter();
  const wallet = useHeartWallet();
  const { user, profile: savedProfile, openingCompleted, status } = useCloudSession();
  const [profile, setProfile] = useState(() => savedProfile || EMPTY_PROFILE);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "ready" && (!user || user.isAnonymous)) router.replace("/");
  }, [router, status, user]);

  const save = async (event) => {
    event.preventDefault();
    if (!normalizeUserProfile(profile)) {
      setError("이름, 성별, 나이를 확인해 주세요. 나이는 6~120세로 입력할 수 있어요.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await saveAccountProfile(profile);
      if (!openingCompleted) {
        router.replace("/opening");
        return;
      }
      setNotice("프로필을 저장했어요. 다음 대화부터 새 정보가 적용돼요.");
    } catch (failure) {
      setError(accountErrorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setBusy(true);
    setError("");
    try {
      await logoutAccount();
      router.replace("/");
    } catch (failure) {
      setError(accountErrorMessage(failure));
      setBusy(false);
    }
  };

  return <main className="app-container my-page">
    <header className="my-header"><span className="directory-eyebrow">H.E.A.R.T PROJECT</span><h1>마이 페이지</h1><p>내 계정과 프로필을 관리해요.</p></header>
    <div className="my-scroll-area">
      <section className="my-account-card">
        <span className="my-avatar" aria-hidden="true">♥</span>
        <div><strong>{savedProfile?.name || "프로필을 완성해 주세요"}</strong><p>{user?.email || "로그인된 계정"}</p></div>
      </section>
      <section className="my-wallet-card"><span>내 하트 포인트</span><strong>♥ {wallet.balance}</strong><small>구매한 배경 {wallet.owned.length}개 · 보유 선물 {Object.values(wallet.bag).reduce((sum, count) => sum + count, 0)}개</small></section>
      <section className="start-form my-profile-card">
        <h2>{savedProfile ? "프로필 수정" : "프로필 완성"}</h2>
        <p className="start-form-intro">피해 친구가 나를 부르고 대화할 때 사용할 정보예요.</p>
        <form className="auth-form" onSubmit={save} noValidate>
          <ProfileFields prefix="my" profile={profile} onChange={setProfile} />
          {error && <p className="start-error" role="alert">{error}</p>}
          {notice && <p className="my-success" role="status">{notice}</p>}
          <button className="start-button" type="submit" disabled={busy}>{busy ? "처리 중…" : "프로필 저장하기"}<span aria-hidden="true">→</span></button>
        </form>
      </section>
      {savedProfile && <Link className="my-back-link" href="/chat">채팅으로 돌아가기 →</Link>}
      <button className="my-logout" type="button" onClick={logout} disabled={busy}>로그아웃</button>
    </div>
    <AppBottomNav active="my" />
  </main>;
}
