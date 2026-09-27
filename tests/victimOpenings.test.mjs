import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { SCENARIOS } from "../src/lib/scenarios.js";
import { VICTIM_OPENINGS, hasFinishedVictimOpening } from "../src/lib/victimOpenings.js";

test("every victim has a distinct first-person story with three interactive moments and a local visual", () => {
  assert.deepEqual(Object.keys(VICTIM_OPENINGS).sort(), SCENARIOS.map((scenario) => scenario.id).sort());
  const endings = new Set();
  for (const scenario of SCENARIOS) {
    const story = VICTIM_OPENINGS[scenario.id];
    assert.equal(story.scenes.length, 5, scenario.id);
    assert.equal(story.scenes.filter((scene) => scene.choices).length, 3, scenario.id);
    assert.ok(story.scenes.some((scene) => scene.line.includes("나는")), scenario.id);
    assert.ok(existsSync(new URL(`../public/vn/${scenario.id}.webp`, import.meta.url)), scenario.id);
    for (const scene of story.scenes) {
      assert.ok(scene.title && scene.line, scenario.id);
      if (scene.choices) {
        assert.equal(scene.choices.length, 2, scenario.id);
        for (const choice of scene.choices) assert.ok(choice.text && choice.response, scenario.id);
      }
    }
    endings.add(story.scenes.at(-1).line);
  }
  assert.equal(endings.size, SCENARIOS.length);
});

test("only a new conversation needs the story; prior chats and completed stories skip it", () => {
  assert.equal(hasFinishedVictimOpening(null), false);
  assert.equal(hasFinishedVictimOpening({ messages: [{ sender: "victim" }] }), false);
  assert.equal(hasFinishedVictimOpening({ victimOpeningCompleted: true, messages: [{ sender: "victim" }] }), true);
  assert.equal(hasFinishedVictimOpening({ messages: [{ sender: "user" }] }), true);
  assert.equal(hasFinishedVictimOpening({ messages: [{ sender: "system" }] }), true);
});
