import Link from "next/link";

export default function AppBottomNav({ active }) {
  return <nav className="app-bottom-nav" aria-label="하단 메뉴">
    <Link className={active === "chat" ? "active" : ""} href="/chat" aria-current={active === "chat" ? "page" : undefined}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.4c0 4.3-3.6 7.5-8.1 7.5-1.1 0-2.1-.2-3.1-.5l-4.1 1.4 1.1-3.4C4.6 15.1 4 13.4 4 11.4 4 7.2 7.6 4 12 4s8 3.2 8 7.4Z" /></svg>
      <span>채팅</span>
    </Link>
    <Link className={active === "shop" ? "active" : ""} href="/shop" aria-current={active === "shop" ? "page" : undefined}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 9h15l-1 11h-13l-1-11Zm3.2 0V7a4.3 4.3 0 0 1 8.6 0v2" /></svg>
      <span>하트 상점</span>
    </Link>
    <Link className={active === "my" ? "active" : ""} href="/my" aria-current={active === "my" ? "page" : undefined}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.4-3.7 2.8-5.7 7-5.7s6.6 2 7 5.7" /></svg>
      <span>마이 페이지</span>
    </Link>
  </nav>;
}
