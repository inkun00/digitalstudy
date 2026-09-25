"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCloudSession } from "@/components/CloudSyncProvider";
import { SCENARIOS } from "@/lib/scenarios";
import { getStoredProfile } from "@/lib/userProfile";

const TALE_CHAPTERS = [
  {
    friend: "yeeun",
    title: "예은이의 멈춘 춤",
    lead: "첫 번째 불빛은 예은이의 방에서 켜졌어. 어제까지만 해도 이 방에는 신나는 춤 음악이 흘렀지.",
    story: "예은이가 좋아하는 춤 영상을 올리자 모르는 사람들이 얼굴과 몸을 놀리는 댓글을 남겼어. 예은이는 연습화를 벗은 채 휴대전화만 바라보고 있었어.",
    message: "내가 좋아하는 걸 올린 것뿐인데… 이제 춤추는 게 무서워.",
    ending: "너는 예은이가 다시 좋아하는 춤을 떠올릴 수 있도록, 먼저 아픈 마음부터 들어 주고 싶어졌어.",
    image: "/opening/friend-yeeun.webp",
    alt: "춤 영상에 달린 상처 주는 댓글을 보고 슬퍼하는 예은",
  },
  {
    friend: "haeun",
    title: "하은이에게 붙은 거짓 이름표",
    lead: "두 번째 불빛은 학교 복도에서 켜졌어. 하은이는 평소처럼 걸었지만, 친구들의 시선이 낯설게 느껴졌어.",
    story: "익명 게시판에 하은이가 친구의 돈을 훔쳤다는 거짓 글이 올라온 거야. 아무리 아니라고 말해도 소문은 더 빨리 퍼졌어.",
    message: "나 정말 그런 적 없어. 아무도 내 말을 믿어 주지 않을까 봐 겁나.",
    ending: "너는 하은이의 말부터 믿고 들어 주기로 했어. 거짓 소문 때문에 혼자 싸우게 두고 싶지 않았거든.",
    image: "/opening/friend-haeun.webp",
    alt: "거짓 소문을 보고 억울해하는 하은",
  },
  {
    friend: "minji",
    title: "민지의 빈 채팅방",
    lead: "세 번째 불빛을 열자 민지의 단체 채팅방이 보였어. 얼마 전까지만 해도 메시지가 끊이지 않던 곳이었지.",
    story: "모둠 발표 뒤 친구들이 민지를 단체로 비웃었어. 그러고는 민지만 남겨 둔 채 새 대화방을 만들었지. 민지는 내일 학교에 가는 일이 두려워졌어.",
    message: "내가 없는 방에서 다들 웃고 있을까 봐 무서워.",
    ending: "너는 민지가 채팅방에서 혼자 남겨졌어도, 마음까지 혼자 두지는 않겠다고 생각했어.",
    image: "/opening/friend-minji.webp",
    alt: "조용해진 단체 대화방을 보며 외로워하는 민지",
  },
  {
    friend: "jiho",
    title: "지호를 따라오는 그림자",
    lead: "네 번째 불빛은 지호가 좋아하던 게임 화면에서 반짝였어. 하지만 지호는 접속 버튼을 누르지 못했어.",
    story: "낯선 아바타들이 며칠째 지호를 따라다니며 길을 막고 무서운 말을 보냈어. 게임을 꺼도 그 장면이 떠올라 가슴이 두근거렸지.",
    message: "다시 들어가면 또 따라올까 봐 무서워. 어떻게 해야 해?",
    ending: "너는 지호가 안전한 곳에서 숨을 고르고, 믿을 만한 어른에게 함께 이야기할 수 있기를 바랐어.",
    image: "/opening/friend-jiho.webp",
    alt: "게임 속 괴롭힘을 겪고 두려워하는 지호",
  },
  {
    friend: "junwoo",
    title: "준우의 빛나는 아이템",
    lead: "다섯 번째 불빛에는 준우가 몇 달 동안 모아 얻은 게임 아이템이 빛나고 있었어.",
    story: "그런데 다른 아이들이 아이템을 내놓지 않으면 학교에서 가만두지 않겠다고 했어. 준우는 그 말을 읽고도 누구에게 털어놓아야 할지 몰랐지.",
    message: "그냥 주면 괴롭힘이 끝날까? 내일이 너무 무서워.",
    ending: "너는 준우가 혼자 결정하거나 협박을 견디지 않도록, 곁에서 도움을 찾고 싶어졌어.",
    image: "/opening/friend-junwoo.webp",
    alt: "게임 아이템을 내놓으라는 협박을 받고 걱정하는 준우",
  },
  {
    friend: "sua",
    title: "수아가 숨기고 싶은 사진",
    lead: "여섯 번째 불빛이 켜지자 수아는 휴대전화를 가슴에 꼭 안았어.",
    story: "예전에 친한 친구에게 보낸 우스운 표정 사진을 누군가 퍼뜨리겠다고 했어. 숙제를 대신해 주지 않으면 학교 단체방에 올리겠다며 수아를 겁주었지.",
    message: "그 사진이 퍼지면 어떡하지? 시키는 대로 해야 할까?",
    ending: "너는 수아가 부끄러워할 일이 아니라는 말을 전하고 싶었어. 사진을 이용해 겁준 사람이 잘못한 거니까.",
    image: "/opening/friend-sua.webp",
    alt: "사진을 퍼뜨리겠다는 협박에 불안해하는 수아",
  },
  {
    friend: "doyoon",
    title: "도윤이의 흩어진 일기장",
    lead: "일곱 번째 불빛 아래, 도윤이가 혼자 간직하던 일기의 문장이 낯선 곳으로 흩어졌어.",
    story: "누군가 도윤이의 계정에 들어가 비공개 일기와 가족 사진을 퍼뜨렸어. 도윤이 이름으로 심한 말까지 보내서 친구들은 도윤이를 오해하고 있었지.",
    message: "그건 내가 보낸 말이 아니야. 내 비밀도 어떻게 되돌려야 할지 모르겠어.",
    ending: "너는 도윤이의 억울함을 먼저 듣고, 안전하게 계정을 지킬 방법을 함께 찾아야겠다고 생각했어.",
    image: "/opening/friend-doyoon.webp",
    alt: "계정 도용으로 일기와 가족 사진이 퍼져 당황한 도윤",
  },
  {
    friend: "seoyeon",
    title: "서연이의 낯선 사진",
    lead: "여덟 번째 불빛을 누르자 서연이는 자기 얼굴이 담긴 낯선 사진을 발견했어.",
    story: "누군가 서연이의 사진을 마음대로 바꾸어 학교 익명 계정에 올렸어. 친구들은 장난이라고 웃었지만, 서연이는 내일 학교에 가기가 두려웠지.",
    message: "이건 진짜 내 모습이 아닌데… 다들 나를 이상하게 볼까 봐 무서워.",
    ending: "너는 서연이 탓이 아니라고 말해 주고 싶었어. 퍼진 사진을 멈출 수 있도록 어른의 도움도 함께 찾아야 했어.",
    image: "/opening/friend-seoyeon.webp",
    alt: "허락 없이 바뀌어 퍼진 사진을 보고 걱정하는 서연",
  },
  {
    friend: "siwoo",
    title: "시우의 빨간 데이터 표시",
    lead: "아홉 번째 불빛에는 시우의 휴대전화 데이터가 거의 남지 않았다는 표시가 떠 있었어.",
    story: "형들이 날마다 시우에게 핫스팟을 켜 달라고 강요했어. 거절하면 때리겠다고 해서 시우는 데이터가 다 없어질 때까지 아무 말도 못 했지.",
    message: "이제 데이터도 없는데 또 켜 달라고 하면 어떡해?",
    ending: "너는 시우가 두려운 일을 혼자 감당하지 않도록, 믿을 만한 어른에게 바로 알리는 길을 떠올렸어.",
    image: "/opening/friend-siwoo.webp",
    alt: "강제로 핫스팟을 켜 주다 데이터가 떨어져 걱정하는 시우",
  },
  {
    friend: "hyunwoo",
    title: "현우의 이름이 적힌 투표",
    lead: "마지막 불빛을 열자 현우의 이름이 적힌 익명 투표가 화면에 떠 있었어.",
    story: "누군가 '우리 반에서 제일 별로인 아이'를 고르는 투표에 현우를 올렸어. 투표 화면은 친구들 사이로 퍼졌고, 현우는 복도에서도 웃음소리가 자신을 향하는 것 같았지.",
    message: "사람들이 내 이름을 누르며 웃었어. 아무도 말리지 않았어.",
    ending: "너는 현우가 느낀 외로움을 지나치지 않기로 했어. 한 사람의 편이 되어 주는 것부터 시작할 수 있으니까.",
    image: "/opening/friend-hyunwoo.webp",
    alt: "모욕적인 익명 투표에 이름이 올라 상처받은 현우",
  },
];

const findFriend = (id) => SCENARIOS.find((scenario) => scenario.id === id);

const OPENING_SCENES = [
  { src: "/opening/01-messages.webp", alt: "여러 친구에게서 온 메시지를 확인하는 아이", kind: "intro" },
  ...TALE_CHAPTERS.map(({ image: src, alt }) => ({ src, alt })),
  { src: "/opening/06-friends.webp", alt: "이야기를 들어 줄 친구를 기다리는 열 명의 아이들", kind: "friends" },
  { src: "/opening/07-listening-v2.webp", alt: "힘든 이야기를 하는 친구에게 눈을 맞추고 귀 기울이는 아이" },
  { src: "/opening/08-song.webp", alt: "친구를 위해 만든 악보를 따뜻하게 건네는 아이" },
];

function OpeningScene({ page }) {
  const scene = OPENING_SCENES[page];
  return <div className={`opening-scene${scene.kind ? ` opening-scene--${scene.kind}` : ""}`}>
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
  const friendsPage = TALE_CHAPTERS.length + 1;
  const missionPage = friendsPage + 1;
  const songPage = missionPage + 1;
  const totalPages = songPage + 1;
  const currentChapter = TALE_CHAPTERS[page - 1];
  const currentFriend = currentChapter && findFriend(currentChapter.friend);

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

        {currentChapter && <section className="opening-chapter opening-tale" aria-labelledby="opening-title">
          <span className="opening-kicker">{page}장 · {currentFriend.name}의 메시지</span>
          <h1 id="opening-title">{currentChapter.title}</h1>
          <p className="opening-lead">{currentChapter.lead}</p>
          <OpeningScene page={page} />
          <div className="opening-tale-paper">
            <p>{currentChapter.story}</p>
            <div className="opening-tale-messages"><div className="opening-tale-message">
              <Image src={currentFriend.avatar} alt="" width={33} height={33} sizes="33px" />
              <div><strong>{currentFriend.name}</strong><p>“{currentChapter.message}”</p></div>
            </div></div>
            <p className="opening-tale-ending">{currentChapter.ending}</p>
          </div>
        </section>}

        {page === friendsPage && <section className="opening-chapter opening-friends" aria-labelledby="opening-title">
          <span className="opening-kicker">열 개의 이야기를 읽고 나서</span>
          <h1 id="opening-title">열 개의 불빛,<br />열 명의 친구</h1>
          <p className="opening-lead">이제 너는 열 명의 친구에게 무슨 일이 있었는지 알게 됐어. 겪은 일은 달라도, 모두 자기 이야기를 들어 줄 사람을 기다리고 있었지.</p>
          <OpeningScene page={page} />
          <div className="opening-friend-grid">{SCENARIOS.map((scenario) => <div className="opening-friend" key={scenario.id}>
            <Image src={scenario.avatar} alt="" width={54} height={54} sizes="54px" /><span>{scenario.name}</span>
          </div>)}</div>
          <div className="opening-chat-preview"><span>읽지 않은 메시지</span><p>“지금 이야기해도 될까? 나 혼자서는 너무 힘들어…”</p></div>
        </section>}

        {page === missionPage && <section className="opening-chapter opening-mission" aria-labelledby="opening-title">
          <span className="opening-kicker">다음 장 · 먼저 건네는 말</span>
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

        {page === songPage && <section className="opening-chapter opening-song" aria-labelledby="opening-title">
          <span className="opening-kicker">마지막 장 · 마음을 담은 노래</span>
          <h1 id="opening-title">친구의 내일에<br />노래 한 곡을 선물해.</h1>
          <p className="opening-lead">너는 친구들이 들려준 말을 오래 기억했어. 충분히 이야기 나누어 마음이 가까워진 뒤, 그 마음을 담은 노래를 직접 만들어 건네기로 했지.</p>
          <OpeningScene page={page} />
          <div className="opening-song-card"><span className="opening-song-note" aria-hidden="true">♫</span><div><small>네가 직접 만드는 선물</small><strong>친구를 위한 노래</strong><p>친구의 이야기를 떠올리며 위로와 희망을 가사에 담고, 완성한 노래를 선물해 봐.</p></div></div>
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
