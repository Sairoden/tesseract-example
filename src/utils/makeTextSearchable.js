// LIBRARIES
import { rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  pdfjsWorker ||
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const makeTextSearchable = async (pdfDoc, extractedAllPages) => {
  const pages = pdfDoc.getPages();
  const fontSize = 10;
  const lineHeight = fontSize * 1.2;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    // Get the extracted text for this page, if available
    const extractedText = extractedAllPages[i] || "";

    // Split the extracted text into words
    const words = extractedText.split(/\s+/);

    // Calculate how many words we can fit on each page
    const wordsPerLine = Math.floor(width / (fontSize / 2));
    const linesPerPage = Math.floor(height / lineHeight);
    const wordsPerPage = wordsPerLine * linesPerPage;

    // Truncate words if they exceed the page capacity
    const pageWords = words.slice(0, wordsPerPage);

    // Add invisible text layer
    page.drawText(pageWords.join(" "), {
      x: 0,
      y: height - fontSize,
      size: fontSize,
      // opacity: 0.01, // Nearly transparent
      // color: rgb(1, 1, 1), // White color (invisible)
      color: rgb(1, 0, 0), // Red color
      lineHeight: lineHeight,
      maxWidth: width,
    });
  }

  return pdfDoc;
};
