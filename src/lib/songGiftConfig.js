export const SONG_GIFT_MIN_COMFORT = 70;
export const SONG_GIFT_REFUSAL = "아직은 노래를 듣고 싶지 않아.";
export const SONG_FORMAT_ERROR = "양식에 맞지 않는 파일입니다. 표준 악보 PDF(A4 한 장, 제목·이야기 상자·QR 코드·네 줄 오선보와 가사)를 올려 주세요.";
export const SONG_DUPLICATE_ERROR = "동일한 내용의 노래는 선물할 수 없습니다. 다른 친구에게는 새 가사로 만든 노래를 올려 주세요.";
export const MAX_SONG_PDF_BYTES = 750 * 1024;
export const MAX_SONG_PAGES = 1;
export const MAX_SONG_PAGE_BASE64_LENGTH = 650_000;

export class SongFormatError extends Error {
  constructor() {
    super(SONG_FORMAT_ERROR);
    this.name = "SongFormatError";
    this.code = "INVALID_SONG_FORMAT";
    this.status = 422;
  }
}

export class DuplicateSongError extends Error {
  constructor() {
    super(SONG_DUPLICATE_ERROR);
    this.name = "DuplicateSongError";
    this.code = "DUPLICATE_SONG_CONTENT";
    this.status = 409;
  }
}

export function canReceiveSongGift(score) {
  return Number.isInteger(score) && score >= SONG_GIFT_MIN_COMFORT && score <= 100;
}
