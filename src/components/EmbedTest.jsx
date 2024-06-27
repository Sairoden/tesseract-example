"use client";

import { useState } from "react";
import { degrees, PDFDocument, rgb, StandardFonts, fetch } from "pdf-lib";
import styled from "styled-components";

import qr from "@/assets/images/qr.png";
// import gldd from "@/assets/documents/gldd.pdf";

export default function EmbeddingImage() {
  const [pdfModified, setPdfModified] = useState(false);
  const [file, setFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  const handleFile = (event) => {
    // setFile(event.target.files[0]);
    // setPdfViewer(event.target.files[0]);
    // const pdfDocs = setPdfUrl(URL.createObjectURL(event.target.files[0]));
    const selectedFile = event.target.files[0];
    // console.log(selectedFile);

    // setFile(selectedFile);
    // const pdfDocs = URL.createObjectURL(selectedFile);
    // console.log(pdfDocs);
    setPdfUrl(selectedFile);
  };
  // modifyPdf();
  async function modifyPdf() {
    try {
      // Fetch the PDF file as an ArrayBuffer
      const existingPdfBytes = await fetch(pdfUrl).then((res) =>
        res.arrayBuffer()
      );

      // Load the PDFDocument from the ArrayBuffer
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      // Fetch PNG image
      const pngUrl = "https://pdf-lib.js.org/assets/minions_banana_alpha.png";
      const pngImageBytes = await fetch(pngUrl).then((res) =>
        res.arrayBuffer()
      );

      // Embed the PNG image bytes
      const pngImage = await pdfDoc.embedPng(pngImageBytes);

      // Get the width/height of the PNG image scaled down to 50% of its original size
      const pngDims = pngImage.scale(0.5);

      // Get the first page of the document
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      // Get the width and height of the first page
      const { width, height } = firstPage.getSize();

      // Draw the PNG image near the lower right corner of the JPG image
      firstPage.drawImage(pngImage, {
        x: firstPage.getWidth() / 2 - pngDims.width / 2 + 75,
        y: firstPage.getHeight() / 2 - pngDims.height,
        width: pngDims.width,
        height: pngDims.height,
      });

      // Serialize the PDFDocument to bytes (a Uint8Array)
      const pdfBytes = await pdfDoc.save();

      // Convert Uint8Array to Blob
      const blob = new Blob([pdfBytes.buffer], { type: "application/pdf" });

      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement("a");
      link.href = url;
      link.download = "pdf-lib_modification_example.pdf";
      link.style.display = "none";

      // Append the link to the body
      document.body.appendChild(link);

      // Trigger the download
      link.click();

      // Clean up
      URL.revokeObjectURL(url);
      document.body.removeChild(link);

      // Set state to indicate PDF creation
      setPdfModified(true);

      setTimeout(() => {
        setPdfModified(false);
      }, 4000);
    } catch (error) {
      console.log("Error: " + error);
    }
  }
  return (
    <StyledContainer>
      <p>Upload a PDF to Modify</p>
      <input type="file" onChange={handleFile} accept="application/pdf" />
      <button onClick={modifyPdf} disabled={pdfModified}>
        {pdfModified ? "PDF Modified!" : "Modify PDF"}
      </button>
      <p className="small">(Your browser will download the resulting file)</p>
    </StyledContainer>
  );
}

const StyledContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  p {
    font-family: helvetica;
    font-size: 24px;
    text-align: center;
    margin: 25px;
  }

  .small {
    font-family: helvetica;
    font-size: 18px;
    text-align: center;
    margin: 25px;
  }

  button {
    background-color: #008cba;
    border: none;
    color: white;
    padding: 15px 32px;
    text-align: center;
    font-size: 16px;
    margin-top: 2rem;
  }
`;
