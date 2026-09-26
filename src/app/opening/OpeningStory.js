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
    title: "예은이가 춤추기 무서워졌어",
    lead: "예은이는 춤 연습 영상을 인터넷에 올렸어.",
    story: "그런데 모르는 사람들이 예은이의 얼굴과 몸을 놀리는 댓글을 썼어. 예은이는 좋아하던 춤도 추기 싫어졌어.",
    message: "춤 영상을 올렸을 뿐인데 사람들이 나를 놀려. 너무 속상해.",
    ending: "너는 예은이의 잘못이 아니라고 말해 주고, 속상한 마음을 들어 주기로 했어.",
    image: "/opening/friend-yeeun.webp",
    alt: "춤 영상에 달린 상처 주는 댓글을 보고 슬퍼하는 예은",
  },
  {
    friend: "haeun",
    title: "하은이는 거짓 소문 때문에 힘들어",
    lead: "하은이는 학교 게시판에서 자기 이름을 봤어.",
    story: "누군가 하은이가 친구의 돈을 훔쳤다는 거짓 글을 올렸어. 하은이는 훔치지 않았지만 친구들이 의심하기 시작했어.",
    message: "나 돈을 훔치지 않았어. 친구들이 나를 믿어 줄까?",
    ending: "너는 하은이의 말을 먼저 듣고, 믿을 만한 어른에게 사실을 알릴 수 있도록 돕기로 했어.",
    image: "/opening/friend-haeun.webp",
    alt: "거짓 소문을 보고 억울해하는 하은",
  },
  {
    friend: "minji",
    title: "민지만 단체 채팅방에서 빠졌어",
    lead: "모둠 발표 뒤 친구들이 단체 채팅방에서 민지를 놀렸어.",
    story: "그 뒤 친구들은 민지만 빼고 새 채팅방을 만들었어. 민지는 내일 학교에 가기가 무서워졌어.",
    message: "친구들이 나만 빼고 이야기해. 학교에 가면 또 놀릴까 봐 무서워.",
    ending: "너는 민지가 혼자라고 느끼지 않도록 이야기를 들어 주기로 했어.",
    image: "/opening/friend-minji.webp",
    alt: "조용해진 단체 대화방을 보며 외로워하는 민지",
  },
  {
    friend: "jiho",
    title: "게임에서 지호를 계속 괴롭혀",
    lead: "지호는 친구들과 게임하는 걸 좋아했어.",
    story: "그런데 모르는 게임 캐릭터들이 지호를 따라다니며 길을 막았어. 무서운 말도 계속 보냈어.",
    message: "게임에 들어가면 또 따라올까 봐 무서워. 어떻게 해야 해?",
    ending: "너는 지호의 무서운 마음을 듣고, 어른에게 함께 도움을 청하기로 했어.",
    image: "/opening/friend-jiho.webp",
    alt: "게임 속 괴롭힘을 겪고 두려워하는 지호",
  },
  {
    friend: "junwoo",
    title: "준우에게 게임 아이템을 달라고 했어",
    lead: "준우는 몇 달 동안 게임을 해서 소중한 아이템을 얻었어.",
    story: "다른 아이들이 그 아이템을 달라고 했어. 주지 않으면 학교에서 괴롭히겠다고 겁줬어.",
    message: "아이템을 주면 괴롭히지 않을까? 내일 학교 가기가 무서워.",
    ending: "너는 준우가 혼자 겁내지 않도록 이야기를 듣고, 어른의 도움을 찾기로 했어.",
    image: "/opening/friend-junwoo.webp",
    alt: "게임 아이템을 내놓으라는 협박을 받고 걱정하는 준우",
  },
  {
    friend: "sua",
    title: "사진으로 수아를 겁줬어",
    lead: "수아는 예전에 친구에게 우스운 표정 사진을 보냈어.",
    story: "그런데 누군가 숙제를 대신해 주지 않으면 사진을 학교 단체 채팅방에 올리겠다고 했어. 수아는 그 말이 무서웠어.",
    message: "내 사진이 퍼지면 어떡하지? 시키는 대로 해야 할까?",
    ending: "너는 수아의 잘못이 아니라고 말해 주기로 했어. 사진으로 겁준 사람이 잘못한 거야.",
    image: "/opening/friend-sua.webp",
    alt: "사진을 퍼뜨리겠다는 협박에 불안해하는 수아",
  },
  {
    friend: "doyoon",
    title: "도윤이의 계정에 누가 몰래 들어왔어",
    lead: "도윤이는 자기만 볼 수 있는 일기와 가족 사진을 인터넷 계정에 보관했어.",
    story: "누군가 그 계정에 몰래 들어와 일기와 사진을 퍼뜨렸어. 도윤이 이름으로 친구들에게 나쁜 말도 보냈어.",
    message: "그 말은 내가 보낸 게 아니야. 내 일기와 사진까지 퍼졌어.",
    ending: "너는 도윤이의 말을 듣고, 계정을 다시 안전하게 지킬 방법을 함께 찾기로 했어.",
    image: "/opening/friend-doyoon.webp",
    alt: "계정 도용으로 일기와 가족 사진이 퍼져 당황한 도윤",
  },
  {
    friend: "seoyeon",
    title: "누군가 서연이 사진을 마음대로 바꿨어",
    lead: "서연이는 인터넷에서 자기 얼굴이 들어간 이상한 사진을 봤어.",
    story: "누군가 서연이의 사진을 마음대로 바꿔서 올렸어. 친구들은 장난이라고 웃었지만 서연이는 학교에 가기가 무서웠어.",
    message: "이 사진은 진짜 내 모습이 아니야. 사람들이 나를 이상하게 볼까 봐 무서워.",
    ending: "너는 서연이의 잘못이 아니라고 말해 주고, 어른에게 함께 도움을 청하기로 했어.",
    image: "/opening/friend-seoyeon.webp",
    alt: "허락 없이 바뀌어 퍼진 사진을 보고 걱정하는 서연",
  },
  {
    friend: "siwoo",
    title: "시우에게 휴대전화 인터넷을 나눠 달라고 강요했어",
    lead: "형들이 시우에게 휴대전화 인터넷을 나눠 쓰자고 했어.",
    story: "시우가 싫다고 해도 매일 핫스팟을 켜게 했어. 거절하면 때리겠다고 겁줘서 시우의 인터넷 데이터가 거의 다 떨어졌어.",
    message: "이제 데이터도 없는데 또 켜 달라고 하면 어떡해?",
    ending: "너는 시우가 혼자 겁내지 않도록, 믿을 만한 어른에게 바로 알리기로 했어.",
    image: "/opening/friend-siwoo.webp",
    alt: "강제로 핫스팟을 켜 주다 데이터가 떨어져 걱정하는 시우",
  },
  {
    friend: "hyunwoo",
    title: "현우를 놀리는 투표가 올라왔어",
    lead: "현우는 학교 단체 채팅방에서 자기 이름이 나온 투표를 봤어.",
    story: "누군가 '우리 반에서 제일 별로인 아이'를 고르는 투표에 현우를 올렸어. 친구들이 투표를 퍼뜨리고 현우를 비웃었어.",
    message: "친구들이 내 이름을 누르며 웃었어. 아무도 말리지 않았어.",
    ending: "너는 현우가 외롭지 않도록, 먼저 현우의 이야기를 들어 주기로 했어.",
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
          <span className="opening-kicker">시작 · 친구 10명이 보낸 메시지</span>
          <h1 id="opening-title">{name},<br />친구들이 너에게 연락했어</h1>
          <p className="opening-lead">어느 날 저녁, 네 휴대전화에 친구 10명의 메시지가 왔어. 친구들은 인터넷에서 힘든 일을 겪고 있었어.</p>
          <OpeningScene page={page} />
          <div className="opening-notification"><span className="opening-notification-icon">💬</span><div><strong>친구들의 메시지</strong><p>“내 이야기 좀 들어줄래?”</p></div><span className="opening-notification-badge">10</span></div>
          <p className="opening-tale-afterword">너는 첫 번째 친구의 메시지를 열어 봤어.</p>
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
          <span className="opening-kicker">친구 10명의 이야기를 모두 읽었어</span>
          <h1 id="opening-title">이제 친구들이<br />왜 힘든지 알게 됐어</h1>
          <p className="opening-lead">친구들은 서로 다른 일을 겪었어. 하지만 모두 자기 이야기를 들어 줄 사람을 기다리고 있어.</p>
          <OpeningScene page={page} />
          <div className="opening-friend-grid">{SCENARIOS.map((scenario) => <div className="opening-friend" key={scenario.id}>
            <Image src={scenario.avatar} alt="" width={54} height={54} sizes="54px" /><span>{scenario.name}</span>
          </div>)}</div>
          <div className="opening-chat-preview"><span>친구의 메시지</span><p>“지금 내 이야기 들어줄 수 있어?”</p></div>
        </section>}

        {page === missionPage && <section className="opening-chapter opening-mission" aria-labelledby="opening-title">
          <span className="opening-kicker">이제 친구와 이야기해 봐</span>
          <h1 id="opening-title">먼저 친구의<br />말을 들어 줘</h1>
          <p className="opening-lead">친구가 메시지를 보내면 무슨 일이 있었는지 물어봐. 친구가 자기 마음을 말할 때까지 천천히 들어 줘.</p>
          <OpeningScene page={page} />
          <div className="opening-chat-scene">
            <div className="opening-chat-row"><Image src={SCENARIOS[0].avatar} alt="" width={42} height={42} sizes="42px" /><p>“내 얘기를 들어줄 수 있어?”</p></div>
            <div className="opening-chat-row opening-chat-row-self"><p>“응, 천천히 말해줘. 내가 듣고 있을게.”</p></div>
            <div className="opening-chat-row"><Image src={SCENARIOS[0].avatar} alt="" width={42} height={42} sizes="42px" /><p>“고마워. 조금 안심이 돼.”</p></div>
          </div>
          <div className="opening-mission-foot"><span aria-hidden="true">♥</span><div><strong>친구가 조금 안심했어</strong><p>친구에게 도움이 되는 말을 하면 마음 안정도가 오르고 하트 포인트도 모을 수 있어.</p></div></div>
        </section>}

        {page === songPage && <section className="opening-chapter opening-song" aria-labelledby="opening-title">
          <span className="opening-kicker">마지막 · 친구를 위한 노래</span>
          <h1 id="opening-title">친구를 위해<br />노래를 만들어 줘</h1>
          <p className="opening-lead">친구와 충분히 이야기해서 친구가 안심하기 시작하면, 마음을 위로하는 노래를 직접 만들어 선물해 봐.</p>
          <OpeningScene page={page} />
          <div className="opening-song-card"><span className="opening-song-note" aria-hidden="true">♫</span><div><small>네가 직접 만드는 선물</small><strong>친구를 위한 노래</strong><p>친구에게 힘이 되는 말을 가사에 담아. 노래를 완성하면 친구에게 선물해 봐.</p></div></div>
          <div className="opening-goal"><span className="opening-goal-icon">✦</span><div><strong>이 게임의 목표</strong><p>친구의 이야기를 듣고 노래를 선물해서, 친구가 다시 조금씩 편안하게 지낼 수 있도록 도와줘.</p></div></div>
          <div className="opening-final-avatars" aria-hidden="true">{SCENARIOS.slice(0, 5).map((scenario) => <Image key={scenario.id} src={scenario.avatar} alt="" width={38} height={38} sizes="38px" />)}</div>
          <p className="opening-final-line">이제 친구의 첫 메시지를 열어 봐!</p>
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
