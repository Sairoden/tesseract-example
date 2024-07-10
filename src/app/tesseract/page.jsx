"use client";

// REACT
import { useRef, useState, useEffect } from "react";

// LIBRARIES
import { createWorker } from "tesseract.js";
import cv from "@techstark/opencv-js";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

import QRCode from "qrcode";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";

// UTILS
import { extractFromInternal } from "../../utils";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  pdfjsWorker ||
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function Tesseract() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [inputFile, setInputFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);
  const binarizedCanvasRef = useRef(null);
  const imageLoaded = useRef(false);

  const pdfViewerRef = useRef(null);
  const [qrImage, setQrImage] = useState(null);
  const [ocrData, setOcrData] = useState([]);
  const [modifiedPDF, setModifiedPDF] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    if (file) {
      renderPdfToCanvas(file);
      console.log(file);
    }
  }, [file]);

  const handleFileChange = e => {
    const file = e.target.files[0];
    setInputFile(file);

    const reader = new FileReader();
    reader.onload = function () {
      setFile(reader.result);
      console.log(readerResult);
    };
    reader.readAsArrayBuffer(file);
  };

  const renderPdfToCanvas = async pdfData => {
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    imageLoaded.current = true;
  };

  const handleTesseract = async img => {
    try {
      setIsLoading(true);

      const worker = await createWorker();

      const { data } = await worker.recognize(img);

      if (data) {
        const OCRData = extractFromInternal(data.text);

        setText(data.text);
        setIsLoading(false);
        return OCRData;
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error during OCR process:", error);
      setIsLoading(false);
    }
  };

  const preprocessAndRunOCR = () => {
    if (!imageLoaded.current) return alert("Please load an image first.");

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const cropX = 0;
    const cropY = 0;
    const cropWidth = canvas.width;
    // const cropHeight = canvas.height * 0.4;
    const cropHeight = canvas.height;

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropWidth, cropHeight);

    const imageData = ctx.getImageData(cropX, cropY, cropWidth, cropHeight);

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.putImageData(imageData, 0, 0);

    let src = cv.imread(tempCanvas);
    let dst = new cv.Mat();

    let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(1, 1));
    cv.resize(src, dst, dst.size(), 2, 2, cv.INTER_LINEAR);
    cv.dilate(src, dst, kernel, new cv.Point(-1, -1));

    // cv.GaussianBlur(src, dst, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
    cv.cvtColor(src, dst, cv.COLOR_BGR2GRAY, 0);

    // cv.threshold(src, dst, 50, 100, cv.THRESH_BINARY);

    let low = new cv.Mat(src.rows, src.cols, src.type(), [0, 0, 0, 0]);
    let high = new cv.Mat(src.rows, src.cols, src.type(), [150, 150, 150, 255]);

    cv.inRange(src, low, high, dst);

    cv.imshow(binarizedCanvasRef.current, dst);

    const binarizedDataUrl = binarizedCanvasRef.current.toDataURL();

    src.delete();
    dst.delete();
    low.delete();
    high.delete();

    return binarizedDataUrl;
  };

  const handleOCR = async () => {
    if (!file) return;

    const binarizedDataUrl = preprocessAndRunOCR();
    const OCRData = await handleTesseract(binarizedDataUrl);

    setOcrData(OCRData);
    console.log(OCRData);

    // Generate QR png
    QRCode.toDataURL(
      OCRData,
      { errorCorrectionLevel: "H", width: 300 },
      async (err, dataUrl) => {
        if (err) {
          console.log(err);
          return;
        }

        const pdfBuffer = await inputFile.arrayBuffer();
        console.log("pdfBuffer: ", pdfBuffer);

        // Load the PDFDocument from the ArrayBuffer
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        console.log("pdfDoc: ", pdfDoc);

        // Get the first page of the document
        const beforePages = pdfDoc.getPages();

        const angles = pdfDoc.getPages().map((page, pageIndex) => {
          const rotation = page.getRotation().angle;
          console.log(`Before: Page ${pageIndex + 1} Rotation:`, rotation);
          return rotation;
        });

        // Create a new PDFDocument
        const newPdfDoc = await PDFDocument.create();

        await Promise.all(
          pdfDoc.getPages().map(async (page, index) => {
            const embedPdfDoc = await newPdfDoc.embedPage(page);
            const embedPdfDocDims = embedPdfDoc.scale(1);
            const newPage = newPdfDoc.addPage();
            const pageRotation = angles[index];

            // Draw the embedded page with rotation
            if (pageRotation === 90) {
              newPage.drawPage(embedPdfDoc, {
                ...embedPdfDocDims,
                x: page.getWidth() - embedPdfDocDims.width,
                y: page.getHeight() / 2 + embedPdfDocDims.height,
                rotate: degrees(-90),
              });
            } else if (pageRotation === 180) {
              newPage.drawPage(embedPdfDoc, {
                ...embedPdfDocDims,
                x: page.getWidth(),
                y: page.getHeight(),
                rotate: degrees(180),
              });
            } else if (pageRotation === 270) {
              newPage.drawPage(embedPdfDoc, {
                ...embedPdfDocDims,
                x: embedPdfDocDims.height,
                y: page.getHeight() - embedPdfDocDims.height,
                rotate: degrees(-270),
              });
            } else {
              // Handle other rotation angles if needed
              newPage.drawPage(embedPdfDoc, {
                ...embedPdfDocDims,
                x: 0,
                y: 0,
                rotate: degrees(pageRotation),
              });
            }
            console.log(
              "pdfWidth: ",
              embedPdfDocDims.width,
              " pdfHeight: ",
              embedPdfDocDims.height
            );
            return embedPdfDoc;
          })
        );

        // Get the first page of the document
        const afterPages = newPdfDoc.getPages();
        const firstPage = afterPages[0];

        // Log rotation angle for each page
        afterPages.forEach((page, pageIndex) => {
          const rotation = page.getRotation().angle;
          console.log(`After: Page ${pageIndex + 1} Rotation: `, rotation);
        });

        beforePages.forEach((page, pageIndex) => {
          const rotation = page.getRotation().angle;
          console.log(`Before 2: Page ${pageIndex + 1} Rotation: `, rotation);
        });

        // Embedding of QR
        // Fetch the QR code image
        const pngUrl = dataUrl;
        console.log("pngUrl: ", pngUrl);
        const pngImageBytes = await fetch(pngUrl).then(res =>
          res.arrayBuffer()
        );

        const pngImage = await newPdfDoc.embedPng(pngImageBytes);
        const pngDims = pngImage.scale(0.15);

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

        // ------------------------------------------------------------------------------------------

        // Calculate the position to place the text in the upper right corner
        const txtWidth = boldHelveticaFont.widthOfTextAtSize(textValue, 8);
        const txtXMargin = 2;
        const txtYMargin = 10;
        const txtMargin = txtXMargin + txtYMargin;

        const txtPosX = pageWidth - txtWidth - txtMargin;
        const txtPosY = txtYMargin;

        newPdfDoc.getPages().map(async page => {
          page.drawText(textValue, {
            x: txtPosX,
            y: txtPosY,
            size: 8,
            font: boldHelveticaFont,
            color: rgb(0, 0, 0),
          });
        });

        // Calculate the position to place the image in the lower right corner
        const imageWidth = pngDims.width;
        const imageHeight = pngDims.height;
        const imageXMargin = 10;
        const imageYMargin = 16;
        const imageMargin = imageXMargin + imageYMargin;

        const imagePosX = pageWidth - imageWidth - imageXMargin;
        const imagePosY = imageYMargin;

        // Draw the image on the first page of the document
        firstPage.drawImage(pngImage, {
          x: imagePosX,
          y: imagePosY,
          width: imageWidth,
          height: imageHeight,
        });

        // ------------------------------------------------------------------------------------------

        // Serialize the PDFDocument to bytes (a Uint8Array)
        const pdfBytes = await newPdfDoc.save();
        console.log("pdfBytes: ", pdfBytes);

        // Convert Uint8Array to Blob
        const blob = new Blob([pdfBytes.buffer], { type: "application/pdf" });
        console.log("blob: ", blob);

        // Download feature
        // Create a URL for the Blob
        const url = URL.createObjectURL(blob);
        console.log("url: ", url);

        // Create a temporary link element
        const link = document.createElement("a");
        link.href = url;
        link.download = "pdf-lib_modification_example.pdf";

        // Append the link to the body
        document.body.appendChild(link);

        // Trigger the download
        link.click();

        // Clean up
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
        // End of download feature

        // PDF Viewer
        setPdfViewer(blob, pageNumber);

        // QR Viewer
        setModifiedPDF(blob);
      }
    );
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

  const setPdfViewer = async (inputFile, pageNum) => {
    if (!inputFile || pageNum < 1 || pageNum > totalPages)
      return console.log("Invalid page number:", pageNum);

    const loadingTask = pdfjsLib.getDocument(URL.createObjectURL(inputFile));
    const pdf = await loadingTask.promise;

    if (!pdf) return console.log("Failed to load PDF");

    // Ensure pageNum is within bounds
    if (pageNum < 1 || pageNum > totalPages)
      return console.log("Invalid page number:", pageNum);

    const page = await pdf.getPage(pageNum);

    const container = document.getElementById("canvasContainer");
    const scale = 1.5;
    const viewport = page.getViewport({ scale: scale });

    // Support HiDPI-screens.
    const outputScale = window.devicePixelRatio || 1;

    const canvas = pdfViewerRef.current;

    if (!canvas) return console.log("Canvas ref not found");

    const context = canvas.getContext("2d");
    if (!context) return console.log("Failed to get 2D context from canvas");

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
  };

  const handlePreviousClick = () => {
    if (pageNumber > 1) {
      const newPageNumber = pageNumber - 1;
      setPageNumber(newPageNumber);
      setPdfViewer(modifiedPDF, newPageNumber);
    }
  };

  const handleNextClick = () => {
    if (pageNumber < totalPages) {
      const newPageNumber = pageNumber + 1;
      setPageNumber(newPageNumber);
      setPdfViewer(modifiedPDF, newPageNumber);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="flex items-center space-x-4">
        <input
          type="file"
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          onChange={handleFileChange}
          accept="application/pdf"
        />

        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
          onClick={handleOCR}
        >
          Run OCR
        </button>
      </div>

      <div className="w-full">
        <h3 className="text-lg font-medium mb-2">Recognized Text:</h3>

        <pre className="bg-gray-100 p-4 rounded-md overflow-auto">
          {isLoading ? "Loading..." : text}
        </pre>
      </div>

      {file && (
        <div className="flex items-center justify-center space-x-10">
          <div>
            <h3 className="text-lg font-medium">Pre-processed Image:</h3>
            <canvas
              ref={binarizedCanvasRef}
              className="h-full w-full max-w-md border border-gray-300 rounded-md"
            ></canvas>
          </div>

          <div>
            <h3 className="text-lg font-medium">Original Image:</h3>
            <canvas
              ref={canvasRef}
              className="h-full w-full max-w-md border border-gray-300 rounded-md"
            ></canvas>
          </div>
        </div>
      )}

      {inputFile && (
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
    </div>
  );
}
