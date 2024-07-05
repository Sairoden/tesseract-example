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

// pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function TesseractComponent() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const pdfViewerRef = useRef(null);
  const [dataUrl, setDataUrl] = useState("");

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

    // Data of Licensee
    const licensee = "sample_license_3001";

    // Data of Department
    const departmentArray = gldd.split("-");
    const department = departmentArray[0];
    const site = "https://google.com";

    const DATA = [
      { data: `Date and Time: ${formattedDateTime}\n`, mode: "byte" }, // dateAndTime
      { data: `CTS No.: ${ctsNo}`, mode: "byte" }, // ctsNo, from ocr, formatted date & time, and generated reference number
      // { data: `0`, mode: "byte" }, // ctsNo, from ocr, formatted date & time, and generated reference number
      { data: `\nLicensee: ${licensee}`, mode: "byte" }, // licensee, from ocr
      { data: `\nDepartment: ${department}`, mode: "byte" }, // department, from ocr
      { data: `\nDocument Type: ${docType}`, mode: "byte" }, // documentType, from ocr
      { data: `\nSite: ${site}`, mode: "byte" }, // test
    ];

    // Generate QR png
    QRCode.toDataURL(DATA, { width: 300 }, async (err, dataUrl) => {
      if (err) {
        console.error(err);
        return;
      }

      setDataUrl(dataUrl);

      try {
        console.log(file);
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

        // const xWidthImg = 250; // 3002
        // const xWidthImg = 235; // 3003
        // const xWidthImg = 255; // 3015
        const xWidthImg = 264; // 301
        const xSizeImg =
          firstPage.getWidth() / 2 - pngDims.width / 2 + xWidthImg;
        // const yHeightImg = 340; // 3002
        // const yHeightImg = 315; // 3003
        // const yHeightImg = 315; // 3003
        // const yHeightImg = 355; // 3015
        const yHeightImg = 370; // 3001
        const ySizeImg =
          firstPage.getHeight() / 2 - pngDims.height - yHeightImg;

        // Get the width and height of the first page
        const { width, height } = firstPage.getSize();
        firstPage.drawImage(pngImage, {
          x: xSizeImg,
          y: ySizeImg,
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
        const textLength = textValue.length * 3.16;
        const xWidthTxt = 571; // width until end of qr
        let calculatedWidth = xWidthTxt - textLength;

        while (calculatedWidth + textLength < xWidthTxt) {
          calculatedWidth++;
        }

        while (calculatedWidth + textLength > xWidthTxt) {
          calculatedWidth--;
        }

        const xSizeTxt = calculatedWidth;

        const ySizeTxt =
          firstPage.getHeight() / 2 - pngDims.height - (yHeightImg + 5);

        firstPage.drawText(textValue, {
          x: xSizeTxt,
          y: ySizeTxt,
          size: 6,
          font: boldHelveticaFont,
          color: rgb(0, 0, 0),
        });

        // Serialize the PDFDocument to bytes (a Uint8Array)
        const pdfBytes = await pdfDoc.save();

        // Convert Uint8Array to Blob
        const blob = new Blob([pdfBytes.buffer], { type: "application/pdf" });

        // PDF Viewer
        setPdfViewer(blob);
        setPdfUrl(URL.createObjectURL(blob));

        console.log(pdfBuffer);

        const pdf = await pdfjsLib.getDocument({ data: pdfBuffer }).promise;
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
        {loading ? "Recognizing..." : "Recognize Text"}
      </button>
      {pdfUrl && (
        <div>
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
