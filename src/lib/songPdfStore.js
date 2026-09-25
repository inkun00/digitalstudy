import { Bytes, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseServices } from "./firebaseClient.js";
import { MAX_SONG_PDF_BYTES } from "./songGiftConfig.js";

function songDocument(uid, fileId) {
  if (!uid || !/^song-[0-9a-f-]{36}$/.test(fileId)) throw new Error("노래 선물 파일을 찾을 수 없어요.");
  return doc(getFirebaseServices().db, "users", uid, "chats", fileId);
}

export async function saveSongPdf({ uid, fileId, scenarioId, file }) {
  if (file.size > MAX_SONG_PDF_BYTES) throw new Error("PDF 파일이 허용 크기를 넘었어요.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  await setDoc(songDocument(uid, fileId), {
    kind: "songPdf",
    scenarioId,
    fileName: file.name.slice(0, 120),
    data: Bytes.fromUint8Array(bytes),
    createdAt: serverTimestamp(),
  });
}

export async function downloadSongPdf({ uid, fileId, scenarioId }) {
  const snapshot = await getDoc(songDocument(uid, fileId));
  const value = snapshot.data();
  if (!snapshot.exists() || value?.kind !== "songPdf" || value.scenarioId !== scenarioId || !(value.data instanceof Bytes)) {
    throw new Error("저장된 악보 PDF를 찾지 못했어요.");
  }
  const url = URL.createObjectURL(new Blob([value.data.toUint8Array()], { type: "application/pdf" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = value.fileName || "노래-악보.pdf";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
