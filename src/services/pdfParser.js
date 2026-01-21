import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/build/pdf.mjs";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorker;

const DEFAULT_OPTIONS = {
  maxPages: 15,
  maxCharacters: 20000,
};

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return "unknown";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}

export async function extractPdfText(file, options = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  const pageLimit = Math.min(pdf.numPages, config.maxPages);
  let extractedText = [];
  let totalChars = 0;

  for (let pageNum = 1; pageNum <= pageLimit; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    let pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");

    pageText = pageText.replace(/\s+/g, " ").trim();
    if (!pageText) continue;

    const remainingChars = config.maxCharacters - totalChars;
    if (remainingChars <= 0) break;

    if (pageText.length > remainingChars) {
      pageText = pageText.slice(0, remainingChars) + "…";
    }

    extractedText.push(`--- Page ${pageNum} ---\n${pageText}`);
    totalChars += pageText.length;
  }

  const previewNotice =
    pdf.numPages > pageLimit
      ? `\n\n… ${pdf.numPages - pageLimit} additional page${
          pdf.numPages - pageLimit === 1 ? "" : "s"
        } not included in this preview.`
      : "";

  return `PDF Document: ${file.name}\nPages: ${pdf.numPages}\nSize: ${formatFileSize(
    file.size
  )}\n(Preview limited to ${config.maxPages} pages / ${
    config.maxCharacters
  } characters)\n\n${extractedText.join("\n\n")}${previewNotice}`;
}
