/**
 * Extract text from a PDF file in the browser using pdfjs-dist.
 * Used for the "Upload PDF" theme option.
 */

import * as pdfjsLib from "pdfjs-dist";

// Vite: resolve worker from node_modules so it is served and hashed correctly
// @ts-expect-error - Vite handles ?url for worker
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface PdfToTextResult {
  text: string;
  error?: string;
}

/**
 * Parse a PDF File and return its text content (all pages concatenated).
 * Returns { text } on success or { text: "", error } on failure.
 */
export async function pdfToText(file: File): Promise<PdfToTextResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument(arrayBuffer);
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const parts: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = (textContent.items as { str?: string }[])
        .map((item) => item.str ?? "")
        .join(" ");
      parts.push(pageText);
    }

    const text = parts.join("\n\n").replace(/\s+/g, " ").trim();
    return { text: text || "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read PDF";
    return { text: "", error: message };
  }
}
