"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { loginAccount, registerAccount, accountErrorMessage } from "@/lib/account";
import { getStoredProfile, normalizeUserProfile } from "@/lib/userProfile";
import { useCloudSession } from "@/components/CloudSyncProvider";
import ProfileFields from "@/components/ProfileFields";

const EMPTY_PROFILE = { name: "", gender: "", age: "" };

export default function StartPage() {
  const router = useRouter();
  const { user, profile: savedProfile, status } = useCloudSession();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profile, setProfile] = useState(() => savedProfile || getStoredProfile() || EMPTY_PROFILE);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "ready" && user && !user.isAnonymous && !busy) {
      router.replace(savedProfile ? "/chat" : "/my");
    }
  }, [busy, router, savedProfile, status, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("이메일 주소를 확인해 주세요.");
      return;
    }
    if (!password) {
      setError("비밀번호를 입력해 주세요.");
      return;
    }
    if (mode === "signup") {
      if (password.length < 8) { setError("비밀번호는 8자 이상으로 입력해 주세요."); return; }
      if (password !== confirmPassword) { setError("비밀번호 확인이 일치하지 않아요."); return; }
      if (!normalizeUserProfile(profile)) { setError("이름, 성별, 나이를 확인해 주세요. 나이는 6~120세로 입력할 수 있어요."); return; }
    }
    setBusy(true);
    setError("");
    try {
      if (mode === "signup") {
        await registerAccount(email, password, profile);
        router.replace("/chat");
      } else {
        await loginAccount(email, password);
        router.replace("/chat");
      }
    } catch (failure) {
      setError(accountErrorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  return <main className="start-page">
    <div className="start-shell">
      <header className="start-hero">
        <div className="start-hero-scene">
          <Image src="/hero/counseling-children.png" alt="고민을 말하는 아이와 따뜻하게 귀 기울이는 아이" width={1536} height={1024} priority sizes="(max-width: 480px) 88vw, 320px" />
        </div>
        <span className="start-eyebrow">H.E.A.R.T PROJECT</span>
        <h1>사이버 마음 상담소</h1>
        <p>친구의 이야기를 듣고 따뜻하게 응대하는 연습을 시작해요.</p>
      </header>

      <div className="start-form">
        <div className="auth-tabs" role="tablist" aria-label="계정 이용 방식">
          <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>로그인</button>
          <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); }}>회원가입</button>
        </div>
        <h2>{mode === "signup" ? "내 계정 만들기" : "다시 만나서 반가워요"}</h2>
        <p className="start-form-intro">{mode === "signup" ? "계정과 프로필을 만들면 다른 기기에서도 기록을 이어갈 수 있어요." : "이메일로 로그인해 대화와 하트 기록을 이어가세요."}</p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="account-email">이메일</label>
          <input id="account-email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="이메일을 입력해 주세요" required />

          <label htmlFor="account-password">비밀번호</label>
          <input id="account-password" name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "signup" ? "8자 이상 입력해 주세요" : "비밀번호를 입력해 주세요"} required />

          {mode === "signup" && <>
            <label htmlFor="account-password-confirm">비밀번호 확인</label>
            <input id="account-password-confirm" name="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="비밀번호를 다시 입력해 주세요" required />
            <div className="auth-profile-divider"><strong>내 프로필</strong><span>피해 친구와 대화할 때 사용해요</span></div>
            <ProfileFields prefix="signup" profile={profile} onChange={setProfile} />
          </>}

          {error && <p className="start-error" role="alert">{error}</p>}
          <button className="start-button" type="submit" disabled={busy}>{busy ? "처리 중…" : mode === "signup" ? "회원가입하고 시작하기" : "로그인하기"}<span aria-hidden="true">→</span></button>
        </form>
      </div>
      <p className="start-privacy">대화 기록과 하트·구매 내역은 Firebase 계정에 저장돼요. 기존 익명 기록은 이 화면에서 회원가입하면 이어집니다.</p>
    </div>
  </main>;
}
