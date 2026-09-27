"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { VICTIM_OPENINGS } from "@/lib/victimOpenings";

export default function VictimOpening({ scenario, onComplete, onExit }) {
  const story = VICTIM_OPENINGS[scenario.id];
  const [sceneIndex, setSceneIndex] = useState(0);
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(null);
  const narrativeRef = useRef(null);
  const scene = story.scenes[sceneIndex];
  const chosenChoice = selectedChoiceIndex === null ? null : scene.choices?.[selectedChoiceIndex];
  const isLastScene = sceneIndex === story.scenes.length - 1;

  useEffect(() => {
    narrativeRef.current?.focus();
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
          <Image key={`${scenario.id}-${sceneIndex}`} src={`/vn/${scenario.id}/scene-${sceneIndex}.webp`} alt={`${scenario.name}의 눈으로 본 장면: ${scene.line}`} fill sizes="(max-width: 480px) 100vw, 480px" priority={sceneIndex === 0} className="vn-art-image" />
        )}
        <div className="vn-art-shade" aria-hidden="true" />
        <header className="vn-header">
          <button type="button" className="vn-exit" onClick={onExit} aria-label="친구 목록으로 돌아가기">←</button>
          <span className="vn-count">{String(sceneIndex + 1).padStart(2, "0")} / {String(story.scenes.length).padStart(2, "0")}</span>
        </header>
        <div className="vn-progress" aria-label={`이야기 ${sceneIndex + 1} / ${story.scenes.length}`}>
          {story.scenes.map((_, index) => <span key={index} className={index <= sceneIndex ? "is-active" : ""} />)}
        </div>
      </div>

      <section className="vn-dialogue" aria-live="polite">
        <p className="vn-line" ref={narrativeRef} tabIndex={-1} key={scene.line}>{scene.line}</p>
        <p className="vn-thought" key={story.thoughts[sceneIndex]}>{story.thoughts[sceneIndex]}</p>

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
      </section>
    </main>
  );
}
