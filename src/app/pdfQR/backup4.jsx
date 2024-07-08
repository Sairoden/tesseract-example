"use client";

// backup for 08/07/2024
// backup for embedding pdf

// REACT
import { useState, useRef, useEffect } from "react";

// LIBRARIES
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
import QRCode from "qrcode";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import pdfToText from "react-pdftotext";
import styled from "styled-components";

// UTILS
import { convertOCR } from "../../utils";
import "./page.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
// pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function DocumentOCR() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const pdfViewerRef = useRef(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [qrImage, setQrImage] = useState(null);
  const [ocrData, setOcrData] = useState([]);
  const [modifiedPDF, setModifiedPDF] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);

  const handleFileRecognition = async () => {
    if (!file) return;
    setLoading(true);

    const OCRData = convertOCR(text);
    setOcrData(OCRData);

    try {
      // Generate QR png
      QRCode.toDataURL(OCRData, { width: 300 }, async (err, dataUrl) => {
        if (err) {
          console.log(err);
          return;
        }

        const pdfBuffer = await file.arrayBuffer();

        // Load the PDFDocument from the ArrayBuffer
        const pdfDoc = await PDFDocument.load(pdfBuffer);

        const newPdfDoc = await PDFDocument.create();

        const embedPdfDoc = await newPdfDoc.embedPdf(pdfDoc);

        // const embedPdfDocDims = embedPdfDoc.scale(1);

        // const page = newPdfDoc.addPage();
        // Iterate through each page and add to newPdfDoc
        // embedPdfDoc.forEach((embedPage) => {
        //   const newPage = newPdfDoc.addPage();
        //   newPage.drawPage(embedPage);
        // });

        await Promise.all(
          pdfDoc.getPages().map(async (page) => {
            const embedPage = await newPdfDoc.embedPage(page);
            const newPage = newPdfDoc.addPage();
            newPage.drawPage(embedPage, {
              dontFlip: false,
            });
            return embedPage;
          })
        );

        //  const newDoc =
        // page.drawPage(embedPdfDoc, {
        //   ...embedPdfDocDims,
        //   x: page.getWidth() / 2 - embedPdfDocDims.width / 2,
        //   y: page.getHeight() - embedPdfDocDims.height - 150,
        // });

        // Get the first page of the document
        const pages = newPdfDoc.getPages();
        const firstPage = pages[0];

        // Embedding of QR
        // Fetch the QR code image
        const pngUrl = dataUrl;
        const pngImageBytes = await fetch(pngUrl).then((res) =>
          res.arrayBuffer()
        );

        const pngImage = await newPdfDoc.embedPng(pngImageBytes);
        const pngDims = pngImage.scale(0.12);

        setQrImage(pngUrl);

        // Get the dimensions of the first page or document
        const pageWidth = firstPage.getWidth();
        const pageHeight = firstPage.getHeight();

        // Get CST Number
        const textValue = OCRData[1].data;

        // Embed text
        // Normal font
        // const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        // Bold font
        const boldHelveticaFont = await newPdfDoc.embedFont(
          StandardFonts.HelveticaBold
        );

        // Calculate the position to place the text in the upper right corner
        const txtWidth = boldHelveticaFont.widthOfTextAtSize(textValue, 6);
        const txtXMargin = 5;
        const txtYMargin = 10;
        const txtMargin = txtXMargin + txtYMargin;

        const txtPosX = pageWidth - txtWidth - txtMargin;
        const txtPosY = pageHeight - txtMargin;

        firstPage.drawText(textValue, {
          x: txtPosX,
          y: txtPosY,
          size: 6,
          font: boldHelveticaFont,
          color: rgb(0, 0, 0),
        });

        // Calculate the position to place the image in the lower right corner
        const imageWidth = pngDims.width;
        const imageHeight = pngDims.height;
        const imageXMargin = 0;
        const imageYMargin = 10;
        const imageMargin = imageXMargin + imageYMargin;

        const imagePosX = pageWidth - imageWidth - imageMargin;
        const imagePosY = imageYMargin;

        // Draw the image on the first page of the document
        firstPage.drawImage(pngImage, {
          x: imagePosX,
          y: imagePosY,
          width: imageWidth,
          height: imageHeight,
        });

        // Serialize the PDFDocument to bytes (a Uint8Array)
        const pdfBytes = await newPdfDoc.save();

        // Convert Uint8Array to Blob
        const blob = new Blob([pdfBytes.buffer], { type: "application/pdf" });

        // PDF Viewer
        setPdfViewer(blob, pageNumber);
        // QR Viewer
        setModifiedPDF(blob);
        setPdfUrl(URL.createObjectURL(blob));
      });
    } catch (err) {
      console.log(err);
      setText("Error processing the file.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const inputfile = event.target.files[0];
    setFile(inputfile);

    pdfToText(inputfile)
      .then((text) => setText(text))
      .catch((error) => console.log("Failed to extract text from pdf", error));
  };

  const getTotalPages = async () => {
    if (!modifiedPDF) return;

    const pdfBuffer = await modifiedPDF.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages().length;
    setTotalPages(pages);
  };

  useEffect(() => {
    getTotalPages();
  }, [modifiedPDF]);
  // getTotalPages();

  const setPdfViewer = async (file, pageNum) => {
    if (!file || pageNum < 1 || pageNum > totalPages) {
      console.log("Invalid page number:", pageNum);
      return;
    }

    const loadingTask = pdfjsLib.getDocument(URL.createObjectURL(file));
    const pdf = await loadingTask.promise;

    if (!pdf) {
      console.log("Failed to load PDF");
      return;
    }

    // Ensure pageNum is within bounds
    if (pageNum < 1 || pageNum > totalPages) {
      console.log("Invalid page number:", pageNum);
      return;
    }

    const page = await pdf.getPage(pageNum);

    const container = document.getElementById("canvasContainer");
    const scale = 1.5;
    const viewport = page.getViewport({ scale: scale });
    // Support HiDPI-screens.
    const outputScale = window.devicePixelRatio || 1;

    const canvas = pdfViewerRef.current;

    // const container = document.getElementById("canvasContainer");
    // const canvas = pdfViewerRef.current;

    if (!canvas) {
      console.log("Canvas ref not found");
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      console.log("Failed to get 2D context from canvas");
      return;
    }

    // const viewport = page.getViewport({ scale: 1.5 });
    // const scale = container.clientWidth / viewport.width;
    // const scaledViewport = page.getViewport(scale);

    // canvas.height = scaledViewport.height;
    // canvas.width = scaledViewport.width;

    // const renderContext = {
    //   canvasContext: context,
    //   viewport: scaledViewport,
    // };

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const transform =
      outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

    const renderContext = {
      canvasContext: context,
      transform: transform,
      viewport: viewport,
    };

    page.render(renderContext);
    console.log("totalPages: ", totalPages);
  };

  const handlePreviousClick = () => {
    if (pageNumber > 1) {
      const newPageNumber = pageNumber - 1;
      setPageNumber(newPageNumber);
      setPdfViewer(modifiedPDF, newPageNumber);
      console.log("newPrev: ", newPageNumber);
      console.log("newPrev: ", newPageNumber);
    }
  };

  const handleNextClick = () => {
    if (pageNumber < totalPages) {
      const newPageNumber = pageNumber + 1;
      setPageNumber(newPageNumber);
      setPdfViewer(modifiedPDF, newPageNumber);
      console.log("newNext: ", newPageNumber);
    }
  };

  return (
    <StyledContainer style={{ margin: "auto", width: "75%" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <input
          type="file"
          onChange={handleFileChange}
          accept="application/pdf"
        />
        <button onClick={handleFileRecognition} disabled={loading}>
          {loading ? "Recognizing..." : "Recognize Text"}
        </button>
      </div>
      {pdfUrl && (
        // <div style={{ width: "50%", height: "50%", border: "red 2px solid" }}>
        <div style={{ border: "red 2px solid" }}>
          <h2>Document Details</h2>
          <div
            style={{
              border: "green 2px solid",
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              boxSizing: "border-box",
            }}
          >
            <div style={{ border: "1px black solid", width: "75%" }}>
              {ocrData.map((data, index) => (
                <p key={index}>{data.data}</p>
              ))}
            </div>
            <div style={{ border: "1px black solid" }}>
              {qrImage && (
                <img src={qrImage} width="150px" height="150px" alt="QR Code" />
              )}
            </div>
          </div>
          <h2>Document Preview with QR Code</h2>
          <div
            id="canvasContainer"
            style={{
              margin: "auto",
              maxWidth: "100%",
            }}
          >
            <canvas
              ref={pdfViewerRef}
              id="theCanvas"
              // width="100%"
              // height="0"
              style={{
                maxWidth: "100%",
                // maxHeight: "auto",
                border: "black 2px solid",
                objectFit: "contain",
              }}
            />
          </div>
          <button onClick={handlePreviousClick}>Previous</button>
          <button onClick={handleNextClick}>Next</button>
        </div>
      )}
    </StyledContainer>
  );
}

const StyledContainer = styled.div`
  /* #theCanvas {
    max-width: 100%;
    object-fit: contain;
  }

  @media (max-width: 600px) {
    #theCanvas {
      object-fit: contain;
      width: 100%;
      height: 100%;
    }
  } */
`;
