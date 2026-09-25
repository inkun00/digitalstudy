"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCloudSession } from "@/components/CloudSyncProvider";
import { SCENARIOS } from "@/lib/scenarios";
import { getStoredProfile } from "@/lib/userProfile";

const TYPE_CHAPTERS = {
  1: {
    label: "말과 소문도 상처가 돼요",
    cases: [
      { icon: "💬", name: "사이버 언어폭력", description: "채팅이나 댓글에서 욕설과 비난을 듣는 일이에요.", friend: "yeeun", example: "“내 춤 영상에 심한 댓글이 계속 달려.”" },
      { icon: "📣", name: "사이버 명예훼손", description: "사실이 아닌 소문이나 남의 명예를 해치는 글이 퍼지는 일이에요.", friend: "haeun", example: "“내가 하지 않은 일로 소문이 퍼졌어.”" },
    ],
    feeling: "화면 속 말도 친구의 마음에 오래 남을 수 있어요.",
  },
  2: {
    label: "혼자 남겨지는 두려움",
    cases: [
      { icon: "👥", name: "사이버 따돌림", description: "단체 대화방 등에서 일부러 빼거나 반복해서 소외시키는 일이에요.", friend: "minji", example: "“나만 빼고 단톡방을 다시 만들었어.”" },
      { icon: "🔔", name: "사이버 스토킹", description: "원하지 않는데도 연락이나 사진·영상을 거듭 보내 괴롭히는 일이에요.", friend: "jiho", example: "“게임에 들어가면 계속 따라와서 무서워.”" },
    ],
    feeling: "친구는 혼자 견디기 어려워 도움을 기다리고 있어요.",
  },
  3: {
    label: "억지로 시키거나 빼앗는 일",
    cases: [
      { icon: "⚠️", name: "사이버 강요", description: "원하지 않는 말이나 행동을 온라인에서 억지로 하게 하는 일이에요.", friend: "sua", example: "“시키는 대로 안 하면 내 사진을 퍼뜨린대.”" },
      { icon: "🎮", name: "사이버 갈취", description: "게임머니나 디지털 물건 등을 빼앗는 일이에요.", friend: "junwoo", example: "“내 게임 아이템을 넘기라고 협박해.”" },
    ],
    feeling: "친구의 잘못이 아니에요. 안전한 도움을 함께 찾아야 해요.",
  },
  4: {
    label: "지켜야 할 비밀과 경계",
    cases: [
      { icon: "🔒", name: "개인정보 유출", description: "친구의 사생활이나 비밀, 개인정보를 허락 없이 퍼뜨리는 일이에요.", friend: "doyoon", example: "“내 비공개 일기와 가족 사진이 퍼졌어.”" },
      { icon: "🛡️", name: "사이버 성폭력", description: "성적으로 불쾌한 내용을 올리거나 관련 영상·이미지를 만들고 퍼뜨리는 일이에요.", example: "“내가 원하지 않는 불쾌한 이미지가 공유됐어.”" },
    ],
    feeling: "서둘러 판단하기보다 안전과 피해 확산 방지가 먼저예요.",
  },
};

const OPENING_SCENES = [
  { src: "/opening/01-messages.webp", alt: "여러 친구에게서 온 메시지를 확인하는 아이" },
  { src: "/opening/02-language.webp", alt: "상처 주는 댓글과 거짓 소문에 힘들어하는 두 친구와 다가오는 도움의 손길" },
  { src: "/opening/03-exclusion.webp", alt: "단체 대화에서 소외되어 앉아 있는 친구 곁에 다른 친구가 다가오는 모습" },
  { src: "/opening/04-coercion.webp", alt: "게임 아이템을 빼앗으려는 압박에 힘들어하며 어른에게 도움을 청하려는 아이" },
  { src: "/opening/05-privacy.webp", alt: "흩어진 개인의 기록을 친구와 함께 안전하게 보호하는 모습" },
  { src: "/opening/06-friends.webp", alt: "이야기를 들어 줄 친구를 기다리는 열 명의 아이들" },
  { src: "/opening/07-listening-v2.webp", alt: "힘든 이야기를 하는 친구에게 눈을 맞추고 귀 기울이는 아이" },
  { src: "/opening/08-song.webp", alt: "친구를 위해 만든 악보를 따뜻하게 건네는 아이" },
];

function OpeningScene({ page }) {
  const scene = OPENING_SCENES[page];
  return <div className={`opening-scene opening-scene--${page}`}>
    <Image src={scene.src} alt={scene.alt} fill priority={page === 0} sizes="(max-width: 480px) 90vw, 430px" />
  </div>;
}

export default function OpeningStory({ replay = false }) {
  const router = useRouter();
  const { user, profile, status, openingCompleted, finishOpening } = useCloudSession();
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const storyRef = useRef(null);
  const name = profile?.name || getStoredProfile()?.name || "친구";
  const totalPages = 8;

  useEffect(() => {
    if (status !== "ready") return;
    if (!user || user.isAnonymous) router.replace("/");
    else if (!profile && !getStoredProfile()) router.replace("/my");
    else if (openingCompleted && !replay) router.replace("/chat");
  }, [openingCompleted, profile, replay, router, status, user]);

  const moveTo = (nextPage) => {
    setPage(nextPage);
    setError("");
    storyRef.current?.scrollTo({ top: 0, behavior: "instant" });
  };

  const next = async () => {
    if (page < totalPages - 1) return moveTo(page + 1);
    if (replay && openingCompleted) {
      router.replace("/chat");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await finishOpening();
      router.replace("/chat");
    } catch {
      setError("오프닝 진행 상태를 저장하지 못했어요. 연결을 확인하고 다시 눌러 주세요.");
      setBusy(false);
    }
  };

  if (status !== "ready" || !user || user.isAnonymous || (openingCompleted && !replay)) return <main className="cloud-loading" role="status">친구들의 이야기를 준비하고 있어요…</main>;

  return <main className="opening-page">
    <div className="opening-frame">
      <header className="opening-topbar">
        <div><span className="opening-brand-mark">♥</span><span className="opening-brand">H.E.A.R.T PROJECT</span></div>
        <span className="opening-page-count">{page + 1} / {totalPages}</span>
      </header>
      <div className="opening-progress" aria-label={`오프닝 ${page + 1}단계 / ${totalPages}단계`}>
        {Array.from({ length: totalPages }, (_, index) => <span key={index} className={index <= page ? "is-filled" : ""} />)}
      </div>

      <div className="opening-story" ref={storyRef} key={page}>
        {page === 0 && <section className="opening-chapter opening-intro" aria-labelledby="opening-title">
          <span className="opening-kicker">새로운 메시지가 도착했어요</span>
          <h1 id="opening-title">{name},<br />친구들이 너를 찾고 있어.</h1>
          <p className="opening-lead">온라인에서 힘든 일을 겪은 친구들이 연락했어. 먼저 어떤 이야기가 기다리고 있는지 함께 살펴보자.</p>
          <OpeningScene page={page} />
          <div className="opening-notification"><span className="opening-notification-icon">💬</span><div><strong>친구들의 채팅방</strong><p>“잠깐… 내 이야기 들어줄 수 있어?”</p></div><span className="opening-notification-badge">10</span></div>
        </section>}

        {page >= 1 && page <= 4 && <section className="opening-chapter opening-types" aria-labelledby="opening-title">
          <span className="opening-kicker">사이버폭력 알아보기 · {page} / 4</span>
          <h1 id="opening-title">{TYPE_CHAPTERS[page].label}</h1>
          <p className="opening-lead">사이버폭력은 인터넷과 스마트폰에서 말·문자·사진·영상 등으로 다른 사람에게 피해를 주는 일이야.</p>
          <OpeningScene page={page} />
          <div className="opening-case-list">{TYPE_CHAPTERS[page].cases.map((item) => <article className="opening-case" key={item.name}>
            <div className="opening-case-heading"><span className="opening-case-icon" aria-hidden="true">{item.icon}</span><h2>{item.name}</h2></div>
            <p>{item.description}</p>
            <div className="opening-case-message">{item.friend && <Image src={SCENARIOS.find((scenario) => scenario.id === item.friend).avatar} alt="" width={26} height={26} sizes="26px" />}<span><strong>{item.friend ? SCENARIOS.find((scenario) => scenario.id === item.friend).name : "예시 메시지"}</strong>{item.example}</span></div>
          </article>)}</div>
          <p className="opening-takeaway"><span aria-hidden="true">♥</span>{TYPE_CHAPTERS[page].feeling}</p>
          <small className="opening-source">교육안내서 7쪽의 사이버폭력 유형을 바탕으로 구성했어요.</small>
        </section>}

        {page === 5 && <section className="opening-chapter opening-friends" aria-labelledby="opening-title">
          <span className="opening-kicker">그리고, 너에게 온 열 개의 메시지</span>
          <h1 id="opening-title">이 친구들은<br />모두 네 친구야.</h1>
          <p className="opening-lead">겪은 일은 조금씩 달라도, 자신의 이야기를 들어 줄 사람을 기다리는 마음은 같아.</p>
          <OpeningScene page={page} />
          <div className="opening-friend-grid">{SCENARIOS.map((scenario) => <div className="opening-friend" key={scenario.id}>
            <Image src={scenario.avatar} alt="" width={54} height={54} sizes="54px" /><span>{scenario.name}</span>
          </div>)}</div>
          <div className="opening-chat-preview"><span>친구의 메시지</span><p>“지금 이야기해도 될까? 나 혼자서는 너무 힘들어…”</p></div>
        </section>}

        {page === 6 && <section className="opening-chapter opening-mission" aria-labelledby="opening-title">
          <span className="opening-kicker">첫 번째 미션 · 대화로 곁에 있기</span>
          <h1 id="opening-title">정답을 서두르지 말고,<br />먼저 들어줘.</h1>
          <p className="opening-lead">친구를 선택하고 메시지로 대화해 봐. 감정을 인정하고, 혼자가 아니라는 말을 전하고, 필요하면 믿을 만한 어른의 도움을 함께 찾아줘.</p>
          <OpeningScene page={page} />
          <div className="opening-chat-scene">
            <div className="opening-chat-row"><Image src={SCENARIOS[0].avatar} alt="" width={42} height={42} sizes="42px" /><p>“내 얘기를 들어줄 수 있어?”</p></div>
            <div className="opening-chat-row opening-chat-row-self"><p>“응, 천천히 말해줘. 내가 듣고 있을게.”</p></div>
            <div className="opening-chat-row"><Image src={SCENARIOS[0].avatar} alt="" width={42} height={42} sizes="42px" /><p>“고마워. 조금 안심이 돼.”</p></div>
          </div>
          <div className="opening-mission-foot"><span aria-hidden="true">♥</span><div><strong>따뜻한 대화가 회복의 시작</strong><p>친구의 안정도에 변화를 주고 하트 포인트도 모을 수 있어.</p></div></div>
        </section>}

        {page === 7 && <section className="opening-chapter opening-song" aria-labelledby="opening-title">
          <span className="opening-kicker">마지막 미션 · 희망을 노래로</span>
          <h1 id="opening-title">친구에게 들려줄<br />희망의 노래를 만들어.</h1>
          <p className="opening-lead">충분히 대화해 마음의 거리가 가까워지면, 네가 만든 노래의 악보 PDF를 선물할 수 있어.</p>
          <OpeningScene page={page} />
          <div className="opening-song-card"><span className="opening-song-note" aria-hidden="true">♫</span><div><small>너의 마음을 담은 선물</small><strong>친구를 위한 노래</strong><p>대화에서 들은 마음을 떠올리며 위로와 희망을 가사에 담아 봐.</p></div></div>
          <div className="opening-goal"><span className="opening-goal-icon">✦</span><div><strong>우리의 목표</strong><p>친구가 다시 일상으로 한 걸음 나아갈 수 있도록, 대화와 노래로 곁에 있어 주기.</p></div></div>
          <div className="opening-final-avatars" aria-hidden="true">{SCENARIOS.slice(0, 5).map((scenario) => <Image key={scenario.id} src={scenario.avatar} alt="" width={38} height={38} sizes="38px" />)}</div>
          <p className="opening-final-line">이제, 친구의 첫 메시지를 열어 볼까?</p>
        </section>}
      </div>

      <footer className="opening-footer">
        {error && <p className="opening-error" role="alert">{error}</p>}
        <div className="opening-footer-actions">
          {page > 0 && <button type="button" className="opening-back" onClick={() => moveTo(page - 1)} disabled={busy}>이전</button>}
          <button type="button" className="opening-next" onClick={next} disabled={busy}>{busy ? "저장 중…" : page === totalPages - 1 ? "친구들의 메시지 보기" : "다음 이야기"}<span aria-hidden="true">→</span></button>
        </div>
      </footer>
    </div>
  </main>;
}
