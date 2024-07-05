"use client";

import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import pdfToText from "react-pdftotext";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
// pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function TesseractComponent() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const pdfViewerRef = useRef(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [dataUrl, setDataUrl] = useState(""); // data url of qr json

  function convertOCR(text) {
    let cleanedText = text.replace(/CRM FORM/g, "");

    // TITLE
    const titleRegex = /([A-Z\s\/]+ FORM)(?=.*GLDD)/;
    let titleMatch = titleRegex.exec(cleanedText);

    // FORM NO
    const formNoPattern = /([A-Z]+)\s*–\s*(\d+)/;
    const formNoMatch = cleanedText.match(formNoPattern);

    let formNo;
    if (formNoMatch && formNoMatch.length === 3) {
      const formCode = formNoMatch[1];
      const formNumber = formNoMatch[2];
      formNo = `${formCode}-${formNumber}`;
    }

    // LICENSEE
    const licenseeMatch = cleanedText.match(
      /Effectivity\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}\s+([^\s]+)/i
    );

    const newText = {
      title: titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : null,
      formNo: formNo ? formNo : null,
      licensee: licenseeMatch ? licenseeMatch[1].trim() : null,
    };

    return newText;
  }

  const handleFileChange = (event) => {
    const inputfile = event.target.files[0];
    setFile(inputfile);

    pdfToText(inputfile)
      .then((text) => setText(text))
      .catch((error) =>
        console.error("Failed to extract text from pdf", error)
      );
  };

  const handleFileRecognition = async () => {
    if (!file) return;
    setLoading(true);

    let OCRData = convertOCR(text);

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
    // End of date and time data

    // Data of CTS
    const formNo = OCRData.formNo; // from ocr
    const dateArray = formattedDate.split("/");
    const splitDate = `${dateArray[0]}${dateArray[1]}${dateArray[2]}`;
    const docType = OCRData.title;

    // Combine data of CTS
    const ctsNo = `${formNo}_${docType}_${splitDate}`;
    // End of CTS data

    // Data of Licensee
    const licensee = OCRData.licensee;

    // Data of Department
    const department = formNo.split("-")[0];

    const DATA = [
      { data: `Date and Time: ${formattedDateTime}\n`, mode: "byte" },
      { data: `CTS No.: ${ctsNo}`, mode: "byte" },
      { data: `\nLicensee: ${licensee}`, mode: "byte" },
      { data: `\nDepartment: ${department}`, mode: "byte" },
      { data: `\nDocument Type: ${docType}`, mode: "byte" },
    ];

    try {
      // Generate QR png
      QRCode.toDataURL(DATA, { width: 300 }, async (err, dataUrl) => {
        if (err) {
          console.error(err);
          return;
        }

        setDataUrl(dataUrl);
        setDataUrl(dataUrl);

        const pdfBuffer = await file.arrayBuffer();

        // Load the PDFDocument from the ArrayBuffer
        const pdfDoc = await PDFDocument.load(pdfBuffer);

        // Get the first page of the document
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];

        // Embedding of QR
        // Fetch the QR code image
        const pngUrl = dataUrl;
        const pngImageBytes = await fetch(pngUrl).then((res) =>
          res.arrayBuffer()
        );

        const pngImage = await pdfDoc.embedPng(pngImageBytes);
        const pngDims = pngImage.scale(0.1);

        // Get the dimensions of the first page or document
        const pageWidth = firstPage.getWidth();
        const pageHeight = firstPage.getHeight();

        // Calculate the position to place the image in the lower right corner
        const imageWidth = pngDims.width;
        const imageHeight = pngDims.height;
        const xMargin = 5;
        const yMargin = 10;
        const margin = xMargin + yMargin;

        const posX = pageWidth - imageWidth - margin;
        // const posY = pageHeight - imageHeight - margin; // upper right corner position
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
        setPdfViewer(blob);
        setPdfUrl(URL.createObjectURL(blob));

        const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
        const numPages = pdf.numPages;

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
        }
      });
    } catch (err) {
      console.error(err);
      setText("Error processing the file.");
    } finally {
      setLoading(false);
    }
  };

  const setPdfViewer = (file) => {
    if (!file) return;

    const loadingTask = pdfjsLib.getDocument(URL.createObjectURL(file));
    loadingTask.promise.then((pdf) => {
      pdf.getPage(1).then((page) => {
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
    <>
      <pre>{text}</pre>

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
    </>
  );
}
