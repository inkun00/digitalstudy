import { VICTIM_OPENINGS } from "../src/lib/victimOpenings.js";

// Production art direction for the ten first-person elementary-school stories.
// The scene text and branching reactions come from victimOpenings.js; these
// notes make each distinct location and action unambiguous to the image model.
const artDirection = {
  minji: { outfit: "lavender hoodie", settings: [
    "Back at her desk after a group presentation; colorful poster at the chalkboard and casually dressed classmates nearby, hopeful moment before the bullying starts.",
    "A smartphone in her hands lights up with many hostile group-chat notification shapes while the same classmates turn away.",
    "The classroom feels emptier; classmates huddle in a separate group while her own phone shows an almost empty chat list.",
    "Looking at tomorrow's school schedule on her desk, hands trembling as classmates whisper at a distance.",
    "At her desk, typing a first message to a trusted friend on the smartphone, a small hopeful patch of afternoon sunlight.",
  ] },
  junwoo: { outfit: "cobalt-blue hoodie and comfortable gray pants", settings: [
    "At home holding a tablet game with a newly won glowing fantasy item, proud and excited, warm family living room.",
    "At home the tablet game is interrupted by threatening chat notifications demanding the fantasy item; his hands tense around it.",
    "Several repeated requests stack on the tablet while a small previous gift icon is visible, his fingers hesitating over the screen.",
    "A school hallway near the exit: older elementary pupils in casual hoodies stand at the far end as he pauses with his tablet bag.",
    "At a safe spot by the hallway window, using his phone to message a trusted friend for support.",
  ] },
  seoyeon: { outfit: "mint-green sweatshirt and jeans", settings: [
    "A classmate in a colorful T-shirt shows her a phone with an obviously altered, harmless silly portrait of her; she did not pose for it.",
    "Her own phone shows the altered portrait spreading across a social feed with blurred laughter icons, classmates nearby pointing at screens.",
    "Just outside a classroom door, kids in casual clothes call it a joke while she looks down at her small hands and phone.",
    "At a quiet stairwell bench, looking at the phone and worrying how far the false picture may spread, tearful but safe.",
    "From the quiet stairwell, she opens a message to a trusted friend, sunlight suggesting first hope.",
  ] },
  doyoon: { outfit: "orange T-shirt over a white long-sleeve shirt", settings: [
    "At a home desk, the social account login screen unexpectedly refuses access, hands near keyboard and phone.",
    "Phone shows shocked friend reactions to rude messages sent by an account impersonating him; he stares at it in disbelief.",
    "A private diary notebook and a family photo frame sit near a phone showing blurred posts of personal material in a group chat.",
    "At home beside a desk, phone shows blocked friend icons while he feels wrongly blamed and isolated.",
    "He writes a clear first explanation to a trusted friend on his phone beside the diary, gentle light.",
  ] },
  haeun: { outfit: "sunflower-yellow hoodie and denim jeans", settings: [
    "Entering an elementary classroom at lunchtime; classmates in ordinary colorful casual clothes suddenly stop talking and glance over.",
    "At her desk, holding a phone with an anonymous school rumor-board interface and angry icons about a false theft accusation.",
    "She stands near a friend at classroom tables, but the friend turns away; painful distance between them.",
    "Alone at her desk with phone and notebook, anger and unfairness as she almost types a reply then pauses.",
    "She sends a message explaining the false rumor to a trusted friend while sitting by a sunlit classroom window.",
  ] },
  jiho: { outfit: "forest-green sweatshirt", settings: [
    "At a bedroom desk, holding a tablet showing a cheerful colorful online fantasy world before the trouble begins.",
    "On the tablet, several game avatars block his own smaller avatar's path while his hands attempt to move it.",
    "The game chat shows blurred mocking speech bubbles around the blocked avatar, the bedroom feeling suddenly lonely.",
    "The tablet lies face down on his desk but he still feels troubled; lamp and plush toy nearby.",
    "From the desk he sends a message to a real trusted friend on his phone, a hopeful warm desk lamp.",
  ] },
  yeeun: { outfit: "coral hoodie and loose joggers", settings: [
    "In an elementary dance practice room, looking down at her dance shoes and a phone showing her newly uploaded dance video, excited.",
    "In the same studio, the dance video on her phone gains many cruel blurred appearance comments and sad reaction icons.",
    "Looking into an empty dance-room mirror and at her sneakers, frozen mid-practice because the comments hurt.",
    "Seated by the mirrored wall with music player and dance shoes, remembering why she loved dancing while looking at her phone.",
    "She messages a trusted friend from the dance studio about the hurtful video comments, soft sunset light.",
  ] },
  siwoo: { outfit: "navy blue casual T-shirt and gray sweatpants", settings: [
    "At elementary-school dismissal, holding a phone with an almost empty battery and mobile hotspot indicator, backpack on one shoulder.",
    "In the school hallway, two older elementary pupils in casual street clothes demand he turn on his phone hotspot; no violence.",
    "Walking toward the school exit, phone battery low as he worries about contacting family and refusing more data sharing.",
    "Standing still near school lockers with his phone, troubled that the repeated requests are not truly voluntary.",
    "By the hallway window he uses remaining battery to send a message to a trusted friend asking to talk.",
  ] },
  sua: { outfit: "lilac cardigan over a colorful T-shirt and comfortable trousers", settings: [
    "Inside a slow school bus, her small lilac-sleeved hands grip the seat edge while a classmate behind discreetly raises a phone camera. Focus on worry and privacy violation.",
    "Later at home, she sees a threatening chat message with a small blurred candid thumbnail taken on that bus. Focus on privacy violation and fear.",
    "At her home desk, a homework notebook and phone with repeated coercive, unreadable message bubbles show the demands continuing after she helped once.",
    "At a quiet bus stop after school, she holds the phone near her chest and anxiously remembers the secretly taken bus picture.",
    "At her home desk in gentle afternoon light, she types a first message to a trusted friend, hesitating but reaching out for support.",
  ] },
  hyunwoo: { outfit: "teal-green casual sweatshirt and jeans", settings: [
    "At an elementary classroom desk during break, a group of casually dressed pupils laugh together in the background as phone buzzes.",
    "On his phone, a hurtful group-chat vote interface shows a highlighted bar next to an avatar placeholder and mocking reactions.",
    "In the classroom, casually dressed pupils laugh and say it is only a joke while he grips his phone at his desk.",
    "In the corridor by his classroom, hearing his name called as he looks down at his phone and freezes with worry.",
    "By the classroom window, he types a first message to a trusted friend who might really listen.",
  ] },
};

const common = `Single full-frame portrait 3:4 illustration for a first-person visual novel for Korean fourth-to-sixth grade pupils. The viewpoint character is an actual 9–11-year-old Korean elementary child, seen only through their small hands and sleeves. All other visible children are also 9–11-year-old elementary pupils. EVERY child wears ordinary non-matching casual clothes: T-shirts, hoodies, denim, sneakers. Absolutely NO school uniforms, blazers, ties, pleated/plaid uniform skirts, school crests, or teenage/high-school appearance. Polished soft painterly Korean children's storybook animation style, natural hands and anatomy, emotionally grounded and child-safe. Never depict legible writing or letters, logos, watermark, graphic harm, or a collage. Keep the lower quarter relatively calm for dialogue UI.`;

export function scenePrompt(id, sceneIndex) {
  const direction = artDirection[id];
  const scene = VICTIM_OPENINGS[id].scenes[sceneIndex];
  return `${common} The viewpoint child's recognizable casual outfit is ${direction.outfit}. Scene ${sceneIndex + 1} of 5 in ${id}'s story. ${direction.settings[sceneIndex]} ${id === "sua" ? "" : `Visualize this story moment: ${scene.line}`} Make this a NEW distinct composition from other scenes, not merely a color or camera filter. For references, keep only illustration style and the viewpoint child's same casual sleeves; change the setting/action to the new scene.`;
}

export function choicePrompt(id, sceneIndex, choiceIndex) {
  const direction = artDirection[id];
  const scene = VICTIM_OPENINGS[id].scenes[sceneIndex];
  const choice = scene.choices[choiceIndex];
  return `${common} The viewpoint child's recognizable casual outfit is ${direction.outfit}. This is a NEW image for the immediate consequence of a player choice in scene ${sceneIndex + 1}. Base setting: ${direction.settings[sceneIndex]} The chosen action is: '${choice.text}'. The resulting inner experience is: '${choice.response}'. Visually depict the chosen physical action and its consequence in the same place, with a noticeably different pose and composition from the base scene and from the other choice. Preserve only the reference's storybook style and casual sleeve color. No text embedded in the artwork.`;
}

export function storyboardPrompt(id, sceneIndex, includeBase) {
  const direction = artDirection[id];
  const scene = VICTIM_OPENINGS[id].scenes[sceneIndex];
  const panels = [
    ...(includeBase ? [`LEFT PANEL — before choosing: ${direction.settings[sceneIndex]} ${id === "sua" ? "" : `Story moment: ${scene.line}`}`] : []),
    `${includeBase ? "MIDDLE" : "LEFT"} PANEL — after choosing '${scene.choices[0].text}': visually depict the exact action and result '${scene.choices[0].response}'`,
    `RIGHT PANEL — after choosing '${scene.choices[1].text}': visually depict a clearly different physical action and result '${scene.choices[1].response}'`,
  ];
  return `${common} Create ONE WIDE HORIZONTAL ${includeBase ? "THREE-PANEL TRIPTYCH" : "TWO-PANEL DIPTYCH"} storyboard illustration with ${includeBase ? "three" : "two"} equally sized, sharply separated vertical panels. For a diptych, use an overall 3:2 landscape aspect ratio so each half is a 3:4 portrait scene. Each panel is an individual portrait-oriented visual-novel frame, composed differently, and the interface will show just one panel at a time. Do NOT merge actions across panels. Same Korean elementary child's first-person viewpoint and same ${direction.outfit} sleeves in every panel. Story setting: ${direction.settings[sceneIndex]} ${panels.join(". ")}. All other children wear varied ordinary casual clothes, never uniforms. No captions, labels, words, letters, logos, or speech text in any panel. Make clear scene changes between panels, not just lighting changes.`;
}

if (process.argv[1]?.endsWith("vnArtPrompts.mjs")) {
  const [id, scene, choice] = process.argv.slice(2);
  if (id === "--json") {
    const jobs = Object.keys(artDirection).flatMap((victimId) => VICTIM_OPENINGS[victimId].scenes.flatMap((entry, sceneIndex) => [
      { id: victimId, sceneIndex, choiceIndex: null, prompt: scenePrompt(victimId, sceneIndex) },
      ...(entry.choices || []).map((_, choiceIndex) => ({ id: victimId, sceneIndex, choiceIndex, prompt: choicePrompt(victimId, sceneIndex, choiceIndex) })),
    ]));
    console.log(JSON.stringify(jobs));
    process.exit(0);
  }
  if (!artDirection[id]) throw new Error(`Unknown victim: ${id}`);
  console.log(choice === "--storyboard" ? storyboardPrompt(id, Number(scene), Number(scene) !== 1) : choice === "--diptych" ? storyboardPrompt(id, Number(scene), false) : choice === undefined ? scenePrompt(id, Number(scene)) : choicePrompt(id, Number(scene), Number(choice)));
}
