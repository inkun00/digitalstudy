export const SONG_GIFT_MIN_COMFORT = 70;
export const SONG_GIFT_REFUSAL = "아직은 노래를 듣고 싶지 않아.";
export const MAX_SONG_PDF_BYTES = 750 * 1024;
export const MAX_SONG_PAGES = 5;
export const MAX_SONG_PAGE_BASE64_LENGTH = 650_000;

export function canReceiveSongGift(score) {
  return Number.isInteger(score) && score >= SONG_GIFT_MIN_COMFORT && score <= 100;
}
