"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { VICTIM_OPENINGS } from "@/lib/victimOpenings";

export default function VictimOpening({ scenario, onComplete, onExit }) {
  const story = VICTIM_OPENINGS[scenario.id];
  const [sceneIndex, setSceneIndex] = useState(0);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(null);
  const titleRef = useRef(null);
  const scene = story.scenes[sceneIndex];
  const chosenChoice = selectedChoiceIndex === null ? null : scene.choices?.[selectedChoiceIndex];
  const isLastScene = sceneIndex === story.scenes.length - 1;

  useEffect(() => {
    titleRef.current?.focus();
  }, [sceneIndex]);

  useEffect(() => {
    if (!scene.choices) return;
    const image = new window.Image();
    image.src = `/vn/${scenario.id}/choices-${sceneIndex}.webp`;
  }, [scene.choices, sceneIndex, scenario.id]);

  const advance = () => {
    if (isLastScene) {
      onComplete();
      return;
    }
    setSelectedChoiceIndex(null);
    setSceneIndex((index) => index + 1);
  };

  return (
    <main className="vn-page" aria-label={`${scenario.name}의 이야기`}>
      <div className="vn-art">
        {chosenChoice ? (
          <div
            key={`${sceneIndex}-${selectedChoiceIndex}`}
            className={`vn-art-image vn-art-choice vn-art-choice--${selectedChoiceIndex}`}
            style={{ backgroundImage: `url(/vn/${scenario.id}/choices-${sceneIndex}.webp)` }}
            role="img"
            aria-label={`${scenario.name}의 눈으로 본 선택 장면: ${chosenChoice.text}`}
          />
        ) : (
          <Image key={`${scenario.id}-${sceneIndex}`} src={`/vn/${scenario.id}/scene-${sceneIndex}.webp`} alt={`${scenario.name}의 눈으로 본 장면: ${scene.title}`} fill sizes="(max-width: 480px) 100vw, 480px" priority={sceneIndex === 0} className="vn-art-image" />
        )}
        <div className="vn-art-shade" aria-hidden="true" />
        <header className="vn-header">
          <button type="button" className="vn-exit" onClick={onExit} aria-label="친구 목록으로 돌아가기">←</button>
          <div className="vn-header-copy"><span>그날, {scenario.name}의 시선</span><small>{story.place}</small></div>
          <span className="vn-count">{String(sceneIndex + 1).padStart(2, "0")} / {String(story.scenes.length).padStart(2, "0")}</span>
        </header>
        <div className="vn-progress" aria-label={`이야기 ${sceneIndex + 1} / ${story.scenes.length}`}>
          {story.scenes.map((item, index) => <span key={item.title} className={index <= sceneIndex ? "is-active" : ""} />)}
        </div>
        <span className="vn-viewpoint">1인칭 이야기 · 나는 {scenario.name}</span>
      </div>

      <section className="vn-dialogue" aria-live="polite">
        <span className="vn-dialogue-speaker">{scenario.name}의 마음속 이야기</span>
        <h1 ref={titleRef} tabIndex={-1} key={scene.title}>{scene.title}</h1>
        <p className="vn-line" key={scene.line}>{scene.line}</p>

        {scene.choices && !chosenChoice && (
          <div className="vn-choices" role="group" aria-label={`${scenario.name}의 마음속 선택`}>
            {scene.choices.map((choice, index) => (
              <button type="button" key={choice.text} onClick={() => setSelectedChoiceIndex(index)}>
                <span aria-hidden="true">◇</span>{choice.text}<span className="vn-choice-arrow" aria-hidden="true">›</span>
              </button>
            ))}
          </div>
        )}

        {chosenChoice && <p className="vn-response" key={chosenChoice.response}>{chosenChoice.response}</p>}

        {(!scene.choices || chosenChoice) && (
          <button type="button" className="vn-continue" onClick={advance}>
            {isLastScene ? `${scenario.name}와 대화 시작` : "계속 보기"}<span aria-hidden="true">→</span>
          </button>
        )}
        <p className="vn-footnote">선택에 정답은 없어요. 친구의 마음을 따라가 보세요.</p>
      </section>
    </main>
  );
}
