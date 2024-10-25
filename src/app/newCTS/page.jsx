"use client";

// REACT
import { useRef, useState, useEffect } from "react";

// LIBRARIES
import { createWorker } from "tesseract.js";
import cv from "@techstark/opencv-js";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { createCanvas, loadImage } from "canvas";
import QRCode from "qrcode";

async function findTextPosition(pdfUrl, targetText = "QR") {
  const loadingTask = pdfjsLib.getDocument(pdfUrl);
  const pdf = await loadingTask.promise;
  let position = null;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Look for the specific text in the page's textContent
    textContent.items.forEach(item => {
      if (item.str.includes(targetText)) {
        console.log(
          `Found "${targetText}" on page ${pageNum} at position`,
          item.transform
        );
        position = {
          pageNum: pageNum - 1, // Pages are zero-indexed in pdf-lib
          x: item.transform[4], // x coordinate
          y: item.transform[5], // y coordinate
        };
      }
    });
    if (position) break;
  }
  return position;
}

const ReplaceQRWithImage = () => {
  const [pdfFile, setPdfFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [outputPdf, setOutputPdf] = useState(null);

  const handlePdfChange = e => setPdfFile(e.target.files[0]);
  const handleImageChange = e => setImageFile(e.target.files[0]);

  const handleReplace = async () => {
    if (!pdfFile || !imageFile) return;

    // Convert files to ArrayBuffer
    const pdfBytes = await pdfFile.arrayBuffer();
    const imageBytes = await imageFile.arrayBuffer();

    // Find the position of the text "QR" in the PDF
    const position = await findTextPosition({ data: pdfBytes }, "QR");
    if (!position) {
      alert("Text 'QR' not found in the PDF.");
      return;
    }

    // Replace the text with the image using pdf-lib
    const modifiedPdfBytes = await replaceTextWithImage(
      pdfBytes,
      imageBytes,
      position.x,
      position.y,
      position.pageNum
    );

    // Create a Blob to allow downloading the modified PDF
    setOutputPdf(new Blob([modifiedPdfBytes], { type: "application/pdf" }));
  };

  return (
    <div>
      <h3>Replace QR in PDF with an Image</h3>
      <input type="file" accept="application/pdf" onChange={handlePdfChange} />
      <input type="file" accept="image/*" onChange={handleImageChange} />
      <button onClick={handleReplace}>Replace Text with Image</button>

      {outputPdf && (
        <a href={URL.createObjectURL(outputPdf)} download="modified.pdf">
          Download Modified PDF
        </a>
      )}
    </div>
  );
};

export default ReplaceQRWithImage;

// Replace text with image function
async function replaceTextWithImage(pdfBytes, imageBytes, x, y, pageNum) {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const img = await pdfDoc.embedPng(imageBytes);
  const imgDims = img.scale(0.5); // Scale image as needed

  const pages = pdfDoc.getPages();
  const page = pages[pageNum];

  // Draw the image at the specified position (x, y)
  page.drawImage(img, {
    x: x,
    y: y - imgDims.height, // Adjust y to place image correctly
    width: imgDims.width,
    height: imgDims.height,
  });

  const modifiedPdfBytes = await pdfDoc.save();
  return modifiedPdfBytes;
}
