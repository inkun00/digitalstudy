"use client";

import { useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCloudSession } from "@/components/CloudSyncProvider";
import { chatStorageKey } from "@/lib/cloudState";
import { ENDING_STORIES, findCompletedSongGift } from "@/lib/endingStories";
import { SCENARIOS } from "@/lib/scenarios";

export default function EndingPageClient({ scenarioId }) {
  const router = useRouter();
  const { status, user } = useCloudSession();
  const savedChat = useSyncExternalStore(() => () => {}, () => localStorage.getItem(chatStorageKey(scenarioId)), () => null);
  let chat;
  try { chat = JSON.parse(savedChat || "null"); }
  catch { chat = null; }
  const song = findCompletedSongGift(chat);
  const hasSong = Boolean(song);
  const story = ENDING_STORIES[scenarioId];
  const victim = SCENARIOS.find((scenario) => scenario.id === scenarioId);

  useEffect(() => {
    if (status === "loading") return;
    if (!user || user.isAnonymous) {
      router.replace("/");
      return;
    }
    if (!hasSong) router.replace(`/chat?scenario=${encodeURIComponent(scenarioId)}`);
  }, [hasSong, router, scenarioId, status, user]);

  if (!song) return <main className="ending-loading" role="status">마음 회복 이야기를 불러오는 중이에요…</main>;

  return (
    <main className="ending-page">
      <header className="ending-topbar"><Link href={`/chat?scenario=${encodeURIComponent(scenarioId)}`} aria-label="대화로 돌아가기">←</Link><span>마음 회복 이야기</span><span aria-hidden="true">♥</span></header>
      <div className="ending-content">
        <p className="ending-eyebrow">H.E.A.R.T PROJECT · 상담 엔딩</p>
        <div className="ending-hero"><Image src={story.image} alt={story.scene} width={1536} height={1024} sizes="(max-width: 480px) 100vw, 480px" priority /></div>
        <div className="ending-story">
          <span className="ending-victim">{victim.name}의 새로운 하루</span>
          <h1>{story.title}</h1>
          <p>{story.story}</p>
          <blockquote>{story.step}</blockquote>
        </div>
        <div className="ending-letter"><span aria-hidden="true">💛</span><p>당신의 상담과 노래를 만들기 위해 기울인 노력이 {victim.name}에게 힘이 되었어요. 마음은 천천히 회복되고, 평범한 일상도 한 걸음씩 돌아오고 있습니다.</p></div>
        <div className="ending-song"><span>🎵 마음에 남은 노래</span><strong>{song.title}</strong></div>
        <div className="ending-actions"><Link className="ending-primary" href="/chat">다른 친구 만나기</Link><Link className="ending-secondary" href={`/chat?scenario=${encodeURIComponent(scenarioId)}`}>{victim.name}와의 대화 보기</Link></div>
      </div>
    </main>
  );
}
