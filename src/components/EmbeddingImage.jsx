"use client";

import { useState, useRef } from "react";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
import styled from "styled-components";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"; // used for modifying pdfs
import QRCode from "qrcode"; // used for generating QR codes

// import { v4 as uuidv4 } from "uuid"; // To generate a unique filename (if refNumber is needed)

// DATA
// import { SAMPLE } from "../data";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
// pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function EmbeddingImage() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const pdfViewerRef = useRef(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfModified, setPdfModified] = useState(false);
  const [dataUrl, setDataUrl] = useState(""); // data url of qr json

  const handleFileChange = event => {
    const inputfile = event.target.files[0];
    setFile(inputfile);
  };

  const handleFileRecognition = async () => {
    if (!file) return;

    setLoading(true);
    setText("");

    // Data of formatted date and time
    const currentDate = new Date();

    // Format date part (MM/DD/YYYY)
    const formattedDate = currentDate.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    // Format time part (hh:mm AM/PM)
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedTime = `${hours === 12 ? 12 : hours % 12}:${minutes
      .toString()
      .padStart(2, "0")} ${ampm}`;

    // Combine date and time parts
    const formattedDateTime = `${formattedDate}, ${formattedTime}`; // Example output: "05/15/2024, 10:48 AM"

    // Data of CTS
    const gldd = "GLDD-1234"; // from ocr
    const dateArray = formattedDate.split("/");
    const splitDate = `${dateArray[0]}${dateArray[1]}${dateArray[2]}`;
    const docType = "Inter-office Memorandum"; // from ocr?
    // const refNumber = uuidv4(); // 36 characters with 3 dashes / 33 without dashes

    // Combine data of CTS
    const ctsNo = `${gldd}_${docType}_${splitDate}`;

    const DATA = [
      { data: `Date and Time: ${formattedDateTime}\n`, mode: "byte" }, // dateAndTime
      { data: `CTS No.: ${ctsNo}`, mode: "byte" }, // ctsNo, from ocr, formatted date & time, and generated reference number
      { data: `\nLicensee: sample_license_123456789`, mode: "byte" }, // licensee, from ocr
      { data: `\nDepartment: OGLD`, mode: "byte" }, // department, from ocr
      { data: `\nDocument Type: ${docType}`, mode: "byte" }, // documentType, from ocr
    ];

    // Generate QR png
    QRCode.toDataURL(DATA, { width: 300 }, async (err, dataUrl) => {
      if (err) {
        console.error(err);
        return;
      }

      setDataUrl(dataUrl);

      try {
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
        const pngDims = pngImage.scale(0.2);

        // Get the width and height of the first page
        const { width, height } = firstPage.getSize();
        firstPage.drawImage(pngImage, {
          x: firstPage.getWidth() / 2 - pngDims.width / 2 + 250,
          y: firstPage.getHeight() / 2 - pngDims.height - 350,
          width: pngDims.width,
          height: pngDims.height,
        });

        // Embed text
        // Normal font
        // const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        // Bold font
        const boldHelveticaFont = await pdfDoc.embedFont(
          StandardFonts.HelveticaBold
        );
        const textValue = DATA[1].data;
        const textLength = textValue.length * 3.15;
        const xWidth = 569; // width until end of qr
        let calculatedWidth = xWidth - textLength;

        while (calculatedWidth + textLength < xWidth) {
          calculatedWidth++;
        }

        while (calculatedWidth + textLength > xWidth) {
          calculatedWidth--;
        }
        const xSize = calculatedWidth;

        firstPage.drawText(textValue, {
          x: xSize,
          y: firstPage.getHeight() / 2 - pngDims.height - 355,
          size: 6,
          font: boldHelveticaFont,
          color: rgb(0, 0, 0),
        });

        // Serialize the PDFDocument to bytes (a Uint8Array)
        const pdfBytes = await pdfDoc.save();

        // Convert Uint8Array to Blob
        const blob = new Blob([pdfBytes.buffer], { type: "application/pdf" });

        // Create a URL for the Blob
        // const url = URL.createObjectURL(blob);

        // Create a temporary link element
        // const link = document.createElement("a");
        // link.href = url;
        // link.download = "pdf-lib_modification_example.pdf";
        // link.style.display = "none";

        // // Append the link to the body
        // document.body.appendChild(link);

        // // Trigger the download
        // link.click();

        // // Clean up
        // URL.revokeObjectURL(url);
        // document.body.removeChild(link);

        // Set state to indicate PDF creation
        setPdfModified(true);

        // PDF Viewer
        setPdfViewer(blob);
        setPdfUrl(URL.createObjectURL(blob));

        setTimeout(() => {
          setPdfModified(false);
        }, 4000);

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
    });
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

  return (
    <StyledContainer>
      <input type="file" onChange={handleFileChange} accept="application/pdf" />
      <button onClick={handleFileRecognition} disabled={loading}>
        {loading
          ? "Recognizing..."
          : pdfModified
          ? "PDF Modified!"
          : "Recognize Text"}
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
    </StyledContainer>
  );
}
const StyledContainer = styled.div`
  /* width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column; */

  /* p {
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
  } */

  /* button {
    background-color: #008cba;
    border: none;
    color: white;
    padding: 15px 32px;
    text-align: center;
    font-size: 16px;
    margin-top: 2rem;
  } */
`;
