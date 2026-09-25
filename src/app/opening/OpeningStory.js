"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCloudSession } from "@/components/CloudSyncProvider";
import { SCENARIOS } from "@/lib/scenarios";
import { getStoredProfile } from "@/lib/userProfile";

const TALE_CHAPTERS = {
  1: {
    title: "말풍선에 가시가 돋던 날",
    lead: "첫 번째 불빛을 누르자, 예은이가 올린 춤 영상 위로 차가운 말들이 쏟아졌어.",
    story: "예은이는 좋아하던 춤을 멈췄어. 그때 다른 알림이 울렸지. 하은이가 하지도 않은 일을 했다는 소문이 친구들 사이를 떠돌고 있었어.",
    messages: [
      { friend: "yeeun", text: "내가 좋아하는 걸 올린 것뿐인데… 이제 춤추는 게 무서워." },
      { friend: "haeun", text: "아무도 내 말을 믿어 주지 않을까 봐 겁나." },
    ],
    ending: "너는 두 친구의 메시지 앞에서 한참 손가락을 멈췄어. 지금 필요한 건 서둘러 답을 정하는 일이 아닐지도 몰라.",
  },
  2: {
    title: "조용해진 채팅방의 빈자리",
    lead: "다음 불빛을 열었을 때, 민지의 채팅방은 이상할 만큼 고요했어.",
    story: "친구들이 민지만 빼고 새 대화방을 만든 거야. 한편 지호는 즐겁던 게임에 접속할 때마다 누군가 계속 따라와 괴롭히는 바람에 로그인을 망설이고 있었어.",
    messages: [
      { friend: "minji", text: "내가 사라져도 아무도 모를 것 같아." },
      { friend: "jiho", text: "게임을 끄면 끝날 줄 알았는데, 또 따라올까 봐 무서워." },
    ],
    ending: "화면은 작았지만, 그 안에서 두 친구가 느끼는 외로움은 아주 커 보였어.",
  },
  3: {
    title: "그림자처럼 따라오는 부탁",
    lead: "세 번째 불빛에는 부탁처럼 보이지만, 사실은 거절할 수 없게 만드는 말이 있었어.",
    story: "준우에게는 아끼던 게임 아이템을 내놓으라는 메시지가 왔어. 수아에게는 시키는 대로 하지 않으면 사진을 퍼뜨리겠다는 말이 도착했지.",
    messages: [
      { friend: "junwoo", text: "안 주면 계속 괴롭히겠대. 어떻게 해야 할지 모르겠어." },
      { friend: "sua", text: "내 사진을 퍼뜨린다고 해서 너무 무서워." },
    ],
    ending: "너는 친구들이 잘못해서 이런 일을 겪는 게 아니라는 말을 꼭 전해 주고 싶어졌어.",
  },
  4: {
    title: "허락 없이 흩어진 비밀",
    lead: "네 번째 불빛 아래에는 도윤이가 혼자 간직하던 일기와 가족 사진이 있었어.",
    story: "누군가 그것들을 허락 없이 퍼뜨렸어. 서연이는 자기 사진이 이상하게 바뀐 채 돌아다니는 걸 보고 휴대전화를 내려놓았지. 둘 다 내일 학교에서 마주칠 시선이 두려웠어.",
    messages: [
      { friend: "doyoon", text: "내 비밀이 모두에게 알려졌어. 이제 어떡하지?" },
      { friend: "seoyeon", text: "다른 애들이 나를 이상하게 볼까 봐 학교 가기 싫어." },
    ],
    ending: "너는 두 친구가 혼자 감당하지 않도록, 믿을 만한 어른에게 함께 도움을 청하는 길을 떠올렸어.",
  },
};

const findFriend = (id) => SCENARIOS.find((scenario) => scenario.id === id);

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
          <span className="opening-kicker">프롤로그 · 열 개의 작은 불빛</span>
          <h1 id="opening-title">{name},<br />오늘 밤 네게 온 이야기</h1>
          <p className="opening-lead">어느 조용한 저녁, 휴대전화에 작은 불빛 하나가 켜졌어. 곧 두 개, 세 개… 모두 열 개의 메시지가 너를 기다리고 있었지.</p>
          <OpeningScene page={page} />
          <div className="opening-notification"><span className="opening-notification-icon">💬</span><div><strong>친구들의 채팅방</strong><p>“잠깐… 내 이야기 들어줄 수 있어?”</p></div><span className="opening-notification-badge">10</span></div>
          <p className="opening-tale-afterword">그 불빛들은 모두 네 친구에게서 온 거야. 너는 첫 번째 메시지를 조심스럽게 열었어.</p>
        </section>}

        {page >= 1 && page <= 4 && <section className="opening-chapter opening-tale" aria-labelledby="opening-title">
          <span className="opening-kicker">{page}장 · 친구에게서 온 이야기</span>
          <h1 id="opening-title">{TALE_CHAPTERS[page].title}</h1>
          <p className="opening-lead">{TALE_CHAPTERS[page].lead}</p>
          <OpeningScene page={page} />
          <div className="opening-tale-paper">
            <p>{TALE_CHAPTERS[page].story}</p>
            <div className="opening-tale-messages">{TALE_CHAPTERS[page].messages.map((message) => {
              const friend = findFriend(message.friend);
              return <div className="opening-tale-message" key={message.friend}>
                <Image src={friend.avatar} alt="" width={33} height={33} sizes="33px" />
                <div><strong>{friend.name}</strong><p>“{message.text}”</p></div>
              </div>;
            })}</div>
            <p className="opening-tale-ending">{TALE_CHAPTERS[page].ending}</p>
          </div>
        </section>}

        {page === 5 && <section className="opening-chapter opening-friends" aria-labelledby="opening-title">
          <span className="opening-kicker">5장 · 아직 읽지 못한 두 개의 메시지</span>
          <h1 id="opening-title">열 개의 불빛,<br />열 명의 친구</h1>
          <p className="opening-lead">시우는 억지로 빼앗긴 휴대전화 데이터 때문에, 현우는 자신을 놀리는 투표 때문에 마음이 아팠어. 화면 너머에는 이렇게 저마다 다른 이야기를 가진 열 명의 친구가 있었지.</p>
          <OpeningScene page={page} />
          <div className="opening-friend-grid">{SCENARIOS.map((scenario) => <div className="opening-friend" key={scenario.id}>
            <Image src={scenario.avatar} alt="" width={54} height={54} sizes="54px" /><span>{scenario.name}</span>
          </div>)}</div>
          <div className="opening-chat-preview"><span>읽지 않은 메시지</span><p>“지금 이야기해도 될까? 나 혼자서는 너무 힘들어…”</p></div>
        </section>}

        {page === 6 && <section className="opening-chapter opening-mission" aria-labelledby="opening-title">
          <span className="opening-kicker">6장 · 먼저 건네는 말</span>
          <h1 id="opening-title">“응, 내가<br />듣고 있을게.”</h1>
          <p className="opening-lead">너는 가장 먼저 도착한 메시지에 답장을 썼어. 멋진 해결책 대신, 친구가 안심하고 이야기를 꺼낼 수 있는 한마디였지.</p>
          <OpeningScene page={page} />
          <div className="opening-chat-scene">
            <div className="opening-chat-row"><Image src={SCENARIOS[0].avatar} alt="" width={42} height={42} sizes="42px" /><p>“내 얘기를 들어줄 수 있어?”</p></div>
            <div className="opening-chat-row opening-chat-row-self"><p>“응, 천천히 말해줘. 내가 듣고 있을게.”</p></div>
            <div className="opening-chat-row"><Image src={SCENARIOS[0].avatar} alt="" width={42} height={42} sizes="42px" /><p>“고마워. 조금 안심이 돼.”</p></div>
          </div>
          <div className="opening-mission-foot"><span aria-hidden="true">♥</span><div><strong>작은 답장이 만든 변화</strong><p>친구의 마음이 조금 놓였어. 따뜻한 대화가 쌓이면 회복의 하트도 하나씩 모일 거야.</p></div></div>
        </section>}

        {page === 7 && <section className="opening-chapter opening-song" aria-labelledby="opening-title">
          <span className="opening-kicker">마지막 장 · 마음을 담은 노래</span>
          <h1 id="opening-title">친구의 내일에<br />노래 한 곡을 선물해.</h1>
          <p className="opening-lead">너는 친구들이 들려준 말을 오래 기억했어. 충분히 이야기 나누어 마음이 가까워진 뒤, 그 마음을 담은 노래를 직접 만들어 건네기로 했지.</p>
          <OpeningScene page={page} />
          <div className="opening-song-card"><span className="opening-song-note" aria-hidden="true">♫</span><div><small>네가 직접 만드는 선물</small><strong>친구를 위한 노래</strong><p>친구의 이야기를 떠올리며 위로와 희망을 가사에 담고, 완성한 악보 PDF를 선물해 봐.</p></div></div>
          <div className="opening-goal"><span className="opening-goal-icon">✦</span><div><strong>이 이야기의 끝에서</strong><p>네 대화와 노래가 친구의 마음에 작은 빛이 되어, 친구가 다시 일상으로 한 걸음 나아가길 바라.</p></div></div>
          <div className="opening-final-avatars" aria-hidden="true">{SCENARIOS.slice(0, 5).map((scenario) => <Image key={scenario.id} src={scenario.avatar} alt="" width={38} height={38} sizes="38px" />)}</div>
          <p className="opening-final-line">이제, 네가 이어 쓸 이야기를 시작할 시간이야.</p>
        </section>}
      </div>

      <footer className="opening-footer">
        {error && <p className="opening-error" role="alert">{error}</p>}
        <div className="opening-footer-actions">
          {page > 0 && <button type="button" className="opening-back" onClick={() => moveTo(page - 1)} disabled={busy}>이전 장</button>}
          <button type="button" className="opening-next" onClick={next} disabled={busy}>{busy ? "저장 중…" : page === totalPages - 1 ? "친구들의 메시지 열기" : "다음 장"}<span aria-hidden="true">→</span></button>
        </div>
      </footer>
    </div>
  </main>;
}
