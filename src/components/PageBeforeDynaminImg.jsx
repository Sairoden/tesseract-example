"use client";

import { useState, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
import styled from "styled-components";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"; // used for modifying pdfs
import QRCode from "qrcode"; // used for generating QR codes
import pdfToText from "react-pdftotext";

// import { v4 as uuidv4 } from "uuid"; // To generate a unique filename (if refNumber is needed)

// DATA
// import { SAMPLE } from "../data";

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

    // Data of CTS
    const formNo = OCRData.formNo; // from ocr
    const dateArray = formattedDate.split("/");
    const splitDate = `${dateArray[0]}${dateArray[1]}${dateArray[2]}`;
    const docType = OCRData.title; // from ocr?
    // const refNumber = uuidv4(); // 36 characters with 3 dashes / 33 without dashes

    // Combine data of CTS
    const ctsNo = `${formNo}_${docType}_${splitDate}`;

    // Data of Licensee
    const licensee = OCRData.licensee;

    // Data of Department
    const department = formNo.split("-")[0];

    const DATA = [
      { data: `Date and Time: ${formattedDateTime}\n`, mode: "byte" }, // dateAndTime
      { data: `CTS No.: ${ctsNo}`, mode: "byte" }, // ctsNo, from ocr, formatted date & time, and generated reference number
      // { data: `01234567890-~!@#$%^&*()_[];',./{}:"<>?`, mode: "byte" }, // ctsNo, from ocr, formatted date & time, and generated reference number
      { data: `\nLicensee: ${licensee}`, mode: "byte" }, // licensee, from ocr
      { data: `\nDepartment: ${department}`, mode: "byte" }, // department, from ocr
      { data: `\nDocument Type: ${docType}`, mode: "byte" }, // documentType, from ocr
    ];

    console.log(DATA);

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

        const xWidthImg = 264; // 3001
        const xSizeImg =
          firstPage.getWidth() / 2 - pngDims.width / 2 + xWidthImg;
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
        // let textValue = "0";
        const textValue = DATA[1].data;
        // const textLength = textValue.length * 3.16; // 6 font size
        // 595.32 / 267.5 = 2.2254953271 // 4 font size

        // const textArray = textValue.split("");
        // const specialCharactersRegex = /[ !"'()*,-.:;?[\\\]^`{|}]/;
        // let specialCharCount = 0;
        // const countSpecialCharacters = () => {
        //   textArray.forEach((char) => {
        //     if (specialCharactersRegex.test(char)) {
        //       specialCharCount++;
        //     }
        //   });
        //   return specialCharCount;
        // };
        // countSpecialCharacters();
        // const specialCharLength =
        //   specialCharCount * (firstPage.getWidth() / 267.5 / 2);

        // const textLength =
        //   textValue.length * (firstPage.getWidth() / 267.5) + specialCharCount; // 4 font size
        const textLength = textValue.length * (firstPage.getWidth() / 267.5); // 4 font size

        console.log("Final textLength:", textLength);

        const xWidthTxt = 578; // width until end of qr
        let calculatedWidth = xWidthTxt - textLength;

        while (calculatedWidth + textLength < xWidthTxt) {
          calculatedWidth++;
        }

        while (calculatedWidth + textLength > xWidthTxt) {
          calculatedWidth--;
        }

        const xSizeTxt = calculatedWidth;
        console.log(firstPage.getWidth());
        const ySizeTxt =
          firstPage.getHeight() / 2 - pngDims.height - (yHeightImg + 5);

        // Embed text
        // firstPage.drawText(textValue, {
        //   x: xSizeTxt,
        //   y: ySizeTxt,
        //   size: 4,
        //   font: boldHelveticaFont,
        //   color: rgb(0, 0, 0),
        // });

        // Serialize the PDFDocument to bytes (a Uint8Array)
        const pdfBytes = await pdfDoc.save();

        // Convert Uint8Array to Blob
        const blob = new Blob([pdfBytes.buffer], { type: "application/pdf" });

        // // Download feature
        // // Create a URL for the Blob
        // const url = URL.createObjectURL(blob);

        // // Create a temporary link element
        // const link = document.createElement("a");
        // link.href = url;
        // link.download = "pdf-lib_modification_example.pdf";

        // // // Append the link to the body
        // document.body.appendChild(link);

        // // // Trigger the download
        // link.click();

        // // // Clean up
        // URL.revokeObjectURL(url);
        // document.body.removeChild(link);
        // // End of download feature

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
    <StyledContainer>
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
