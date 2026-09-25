import { MAX_SONG_PAGE_BASE64_LENGTH, MAX_SONG_PAGES, MAX_SONG_PDF_BYTES } from "./songGiftConfig.js";

export async function renderSongPdf(file) {
  if (!file || (file.type !== "application/pdf" && !file.name?.toLowerCase().endsWith(".pdf"))) {
    throw new Error("PDF 악보 파일을 선택해 주세요.");
  }
  if (file.size < 5 || file.size > MAX_SONG_PDF_BYTES) {
    throw new Error(`PDF는 750KB 이하로 올려 주세요. 현재 파일은 ${Math.ceil(file.size / 1024)}KB예요.`);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder("ascii").decode(bytes.subarray(0, 5)) !== "%PDF-") {
    throw new Error("올바른 PDF 파일이 아니에요.");
  }

  const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const loadingTask = pdfjs.getDocument({ data: bytes });
  let pdf;
  try {
    pdf = await loadingTask.promise;
    if (pdf.numPages > MAX_SONG_PAGES) throw new Error(`악보는 ${MAX_SONG_PAGES}쪽까지 올릴 수 있어요.`);
    const pages = [];
    for (let index = 1; index <= pdf.numPages; index += 1) {
      const page = await pdf.getPage(index);
      const unit = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(2.5, 2200 / Math.max(unit.width, unit.height)) });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("PDF 페이지를 이미지로 변환하지 못했어요.");
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      let image = canvas.toDataURL("image/jpeg", 0.78).split(",")[1];
      if (image.length > MAX_SONG_PAGE_BASE64_LENGTH) image = canvas.toDataURL("image/jpeg", 0.55).split(",")[1];
      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();
      if (image.length > MAX_SONG_PAGE_BASE64_LENGTH) throw new Error(`${index}쪽 이미지가 너무 커요. 더 작은 PDF로 다시 저장해 주세요.`);
      pages.push(image);
    }
    return pages;
  } finally {
    await loadingTask.destroy();
  }
}
