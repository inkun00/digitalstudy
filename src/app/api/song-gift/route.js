import { NextResponse } from "next/server";
import { SCENARIOS } from "@/lib/scenarios";
import { normalizeUserProfile } from "@/lib/userProfile";
import { ClovaChatError } from "@/lib/clovaChat";
import { generateSongGiftReply } from "@/lib/songGift";
import { canReceiveSongGift, DuplicateSongError, MAX_SONG_PAGE_BASE64_LENGTH, MAX_SONG_PAGES, SONG_GIFT_REFUSAL, SongFormatError } from "@/lib/songGiftConfig";
import { SONG_FINGERPRINT_PATTERN } from "@/lib/songFingerprint";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { scenarioId, messages, userProfile, comfortScore, pages, usedSongFingerprints = [] } = await req.json();
    const scenario = SCENARIOS.find((item) => item.id === scenarioId);
    const counselor = normalizeUserProfile(userProfile);
    if (!scenario || !counselor) return NextResponse.json({ error: "대화 상대나 상담자 정보를 확인해 주세요." }, { status: 400 });
    if (!canReceiveSongGift(comfortScore)) {
      return NextResponse.json({ error: SONG_GIFT_REFUSAL }, { status: 403 });
    }
    if (!Array.isArray(messages) || messages.length < 2 || messages.length > 80 ||
      messages.some((message) => !["user", "victim", "system"].includes(message?.sender) || typeof message.text !== "string" || message.text.length > 2000) ||
      !messages.some((message) => message.sender === "user") ||
      !Array.isArray(usedSongFingerprints) || usedSongFingerprints.length > 1000 ||
      usedSongFingerprints.some((value) => typeof value !== "string" || !SONG_FINGERPRINT_PATTERN.test(value)) ||
      !Array.isArray(pages) || pages.length < 1 || pages.length > MAX_SONG_PAGES ||
      pages.some((page) => typeof page !== "string" || page.length > MAX_SONG_PAGE_BASE64_LENGTH || !/^[A-Za-z0-9+/]+={0,2}$/.test(page))) {
      return NextResponse.json({ error: "악보 PDF 또는 대화 형식이 올바르지 않아요." }, { status: 400 });
    }
    const song = await generateSongGiftReply({ scenario, messages, counselor, pages, usedSongFingerprints, apiKey: process.env.CLOVA_STUDIO_API_KEY });
    return NextResponse.json(song);
  } catch (error) {
    if (error instanceof ClovaChatError || error instanceof SongFormatError || error instanceof DuplicateSongError) return NextResponse.json({ error: error.message, ...(error.code ? { code: error.code } : {}) }, { status: error.status });
    console.error("[API /song-gift Error]:", error);
    return NextResponse.json({ error: "노래 선물을 처리하지 못했어요. 다시 시도해 주세요." }, { status: 500 });
  }
}
