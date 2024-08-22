// LIBRARIES
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  pdfjsWorker ||
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

let isRendering = false;

export const pdfPreview = async (pdfData, canvasRef, pageNum, scale = 1.5) => {
  if (!canvasRef | !pdfData | isRendering) return;

  isRendering = true;

  try {
    const loadingTask = pdfjsLib.getDocument(
      pdfData instanceof Blob ? URL.createObjectURL(pdfData) : { data: pdfData }
    );
    const pdf = await loadingTask.promise;

    if (!pdf) return;

    const page = await pdf.getPage(pageNum);

    const viewport = page.getViewport({ scale });

    // Support HiDPI-screens.
    const outputScale = window.devicePixelRatio || 1;

    const canvas = canvasRef.current;

    if (!canvas) {
      console.error("Canvas ref not found");
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      console.error("Failed to get 2D context from canvas");
      return;
    }

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const transform =
      outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

    const renderContext = {
      canvasContext: context,
      transform,
      viewport,
    };

    context.clearRect(0, 0, canvas.width, canvas.height);

    await page.render(renderContext).promise;
  } catch (error) {
    console.error("Error rendering PDF:", error);
  } finally {
    isRendering = false;
  }
};
