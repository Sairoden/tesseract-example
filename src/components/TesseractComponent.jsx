"use client";

import { useState, useRef } from "react";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist/build/pdf";

import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
// pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function TesseractComponent() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const pdfViewerRef = useRef(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  const handleFileChange = event => {
    setFile(event.target.files[0]);
    setPdfViewer(event.target.files[0]);
    setPdfUrl(URL.createObjectURL(event.target.files[0]));
  };

  const setPdfViewer = file => {
    if (!file) return;

    const loadingTask = pdfjsLib.getDocument(URL.createObjectURL(file));
    loadingTask.promise.then(pdf => {
      pdf.getPage(1).then(page => {
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = pdfViewerRef.current;
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        page.render(renderContext);
      });
    });
  };

  const handleFileRecognition = async () => {
    if (!file) return;

    setLoading(true);
    setText("");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const texts = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;

        const imageDataUrl = canvas.toDataURL();

        const result = await Tesseract.recognize(imageDataUrl, "eng", {
          logger: m => console.log(m),
        });

        texts.push(result.data.text);
      }

      setText(texts.join("\n"));
    } catch (err) {
      console.error(err);
      setText("Error processing the file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept="application/pdf" />
      <button onClick={handleFileRecognition} disabled={loading}>
        {loading ? "Recognizing..." : "Recognize Text"}
      </button>
      {pdfUrl && (
        <div>
          <h2>PDF Preview</h2>
          <iframe
            src={pdfUrl}
            type="application/pdf"
            width="100%"
            height="600px"
          />

          <canvas ref={pdfViewerRef} />
        </div>
      )}

      <pre>{text}</pre>
    </div>
  );
}
