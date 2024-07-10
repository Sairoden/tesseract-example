"use client";

// REACT
import { useState, useRef } from "react";

// LIBRARIES
import QRCode from "qrcode";
import pdfToText from "react-pdftotext";
import { PDFDocument } from "pdf-lib";

// UTILS
import { extractFromExternal } from "../utils";

export default function HomePage() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const pdfViewerRef = useRef(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  const handleFileRecognition = async () => {
    if (!file) return;
    setLoading(true);

    const OCRData = extractFromExternal(text);
    console.log(OCRData);

    try {
      // Generate QR png
      QRCode.toDataURL(OCRData, { width: 300 }, async (err, dataUrl) => {
        if (err) {
          console.error(err);
          return;
        }

        const pdfBuffer = await file.arrayBuffer();

        // Load the PDFDocument from the ArrayBuffer
        const pdfDoc = await PDFDocument.load(pdfBuffer);

        // Get the first page of the document
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // Embedding of QR
        // Fetch the QR code image
        const pngUrl = dataUrl;

        const pngImageBytes = await fetch(pngUrl).then(res =>
          res.arrayBuffer()
        );

        const pngImage = await pdfDoc.embedPng(pngImageBytes);
        const pngDims = pngImage.scale(0.1);

        // Get the dimensions of the first page or document
        const pageWidth = firstPage.getWidth();
        // const pageHeight = firstPage.getHeight();

        // Calculate the position to place the image in the lower right corner
        const imageWidth = pngDims.width;
        const imageHeight = pngDims.height;
        const xMargin = 5;
        const yMargin = 10;
        const margin = xMargin + yMargin;

        const posX = pageWidth - imageWidth - margin;
        const posY = yMargin;

        // Draw the image on the first page of the document
        firstPage.drawImage(pngImage, {
          x: posX,
          y: posY,
          width: imageWidth,
          height: imageHeight,
        });

        // Serialize the PDFDocument to bytes (a Uint8Array)
        const pdfBytes = await pdfDoc.save();

        // Convert Uint8Array to Blob
        const blob = new Blob([pdfBytes.buffer], { type: "application/pdf" });

        // PDF Viewer
        setPdfUrl(URL.createObjectURL(blob));
      });
    } catch (err) {
      console.error(err);
      setText("Error processing the file.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = event => {
    const inputfile = event.target.files[0];
    setFile(inputfile);

    pdfToText(inputfile)
      .then(text => setText(text))
      .catch(error => console.error("Failed to extract text from pdf", error));
  };

  return (
    <>
      <input type="file" onChange={handleFileChange} accept="application/pdf" />
      <button
        className="p-5 bg-blue-500"
        onClick={handleFileRecognition}
        disabled={loading}
      >
        {loading ? "Recognizing..." : "Recognize Text"}
      </button>

      {pdfUrl && (
        <div>
          <h2>PDF Preview</h2>

          <embed
            src={pdfUrl}
            type="application/pdf"
            width="100%"
            height="600"
          />

          <iframe
            src={pdfUrl}
            type="application/pdf"
            width="100%"
            height="600px"
          />

          <canvas ref={pdfViewerRef} />
        </div>
      )}
    </>
  );
}
