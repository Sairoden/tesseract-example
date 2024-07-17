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

// UTILS
import { extractFromInternal, pageRotation, createQR } from "../../utils";

// ASSETS
import logo from "../../assets/images/pagcor_logo.jpg";

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

  const qrRef = useRef(null);

  const pdfViewerRef = useRef(null);
  const [qrImage, setQrImage] = useState(null);
  const [ocrData, setOcrData] = useState([]);
  const [modifiedPDF, setModifiedPDF] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [base64, setBase64] = useState(null);
  const [qrOutput, setQrOutput] = useState(null);

  const [myQr, setMyQr] = useState(null);

  useEffect(() => {
    if (file) {
      renderPdfToCanvas(file);
    }
  }, [file]);

  const handleFileChange = e => {
    const file = e.target.files[0];
    setInputFile(file);

    const reader = new FileReader();
    reader.onload = function () {
      setFile(reader.result);
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

  async function getDataUrl(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  useEffect(() => {
    const imageUrl = logo.src;
    getDataUrl(imageUrl)
      .then(dataUrl => {
        setBase64(dataUrl);
      })
      .catch(error => {
        console.log("Error converting to data URL:", error);
      });
  }, []);

  const handleOCR = async () => {
    if (!file) return;

    const binarizedDataUrl = preprocessAndRunOCR();
    // const OCRData = await handleTesseract(binarizedDataUrl);

    // Hard coded OCR data
    const subject = "SAMPLE SUBJECT";

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
    const dateArray = formattedDate.split("/");
    const splitDate = `${dateArray[0]}${dateArray[1]}${dateArray[2]}`;

    const department = "RMD";
    const documentType = "GOCC";
    // Combine data of CTS
    const ctsNo = `${department}-${documentType}-${splitDate}-0001`;

    const OCRData = [
      { data: `Date & Time: ${formattedDateTime}\n`, mode: "byte" },
      { data: `CTS No.: ${ctsNo}`, mode: "byte" },
      { data: `\nDepartment: ${department}`, mode: "byte" },
      { data: `\nDocument Type: ${documentType}`, mode: "byte" },
      { data: `\nSubject: ${subject}`, mode: "byte" },
    ];

    setOcrData(OCRData);

    async function create(dataForQRcode, logo, qrWidth) {
      const canvas = createCanvas(qrWidth, qrWidth);
      const ctx = canvas.getContext("2d");

      await QRCode.toCanvas(canvas, dataForQRcode, {
        errorCorrectionLevel: "M",
        margin: 0,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      // Modify the colors to have one half blue and the other half red
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Change dots' colors based on 45-degree line
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const index = (y * canvas.width + x) * 4;
          if (
            data[index] === 0 &&
            data[index + 1] === 0 &&
            data[index + 2] === 0
          ) {
            // Check for black (QR code dots)
            if (x + y < canvas.width) {
              // Change to blue
              data[index] = 3; // Red
              data[index + 1] = 4; // Green
              data[index + 2] = 115; // Blue
            } else {
              // Change to red
              data[index] = 224; // Red
              data[index + 1] = 0; // Green
              data[index + 2] = 1; // Blue
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Load logo image
      const img = await loadImage(logo);

      // const myData = "google.com";
      const myData =
        "https://drive.google.com/drive/folders/1EYxLifM26EhiiCngk3OF9sBI?1T72DyYh?usp=drive_link";

      // Calculate center coordinates for the logo
      // const centerX = (canvas.width - logoWidth) / 2;
      // const centerY = (canvas.height - logoWidth) / 2;

      // const logoWidth = 30; // Set a fixed width for the logo
      // const logoHeight = 30; // Set a fixed height for the logo

      // Determine the logo width based on the length of the data with a minimum size
      const minLogoWidth = 30; // Minimum desired logo width
      let logoWidth = myData.length * 2; // Calculate logo width based on the length of the data
      if (logoWidth < minLogoWidth) {
        logoWidth = minLogoWidth; // Enforce minimum logo width
      }
      const logoHeight = logoWidth; // Assuming the logo maintains aspect ratio

      const centerX = (canvas.width - logoWidth) / 2;
      const centerY = (canvas.height - logoHeight) / 2;

      // Draw logo onto the QR code
      ctx.drawImage(img, centerX, centerY, logoWidth, logoHeight);

      return canvas.toDataURL("image/png");
    }

    // console.log(pngUrl);

    const pngImg = base64;
    // const pngImg = `data:image/png;base64, ${pngUrl}`;

    const qrCodeDataURL = await create(
      "https://drive.google.com/drive/folders/1EYxLifM26EhiiCngk3OF9sBI?1T72DyYh?usp=drive_link",
      // "google.com",
      pngImg,
      150,
      50
    );

    // Use qrCodeDataURL as needed (e.g., display in an <img> tag or save to file)
    // console.log(qrCodeDataURL);
    setQrOutput(qrCodeDataURL);

    const pdfBuffer = await inputFile.arrayBuffer();

    // Load the PDFDocument from the ArrayBuffer
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    const angles = pdfDoc.getPages().map((page, pageIndex) => {
      const rotation = page.getRotation().angle;

      return rotation;
    });

    // -----------------------------------------------------------------------------
    // Create a new PDFDocument
    const newPdfDoc = await PDFDocument.create();

    await pageRotation(pdfDoc, newPdfDoc, angles);

    // -----------------------------------------------------------------------------

    // Get the first page of the document
    const rotatedPages = newPdfDoc.getPages();
    const firstPage = rotatedPages[0];

    const pngUrl = qrCodeDataURL;
    const pngImageBytes = await fetch(pngUrl).then((res) => res.arrayBuffer());

    setQrImage(pngUrl);

    const pngImage = await newPdfDoc.embedPng(pngImageBytes);
    const pngDims = pngImage.scale(0.15);

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
    const txtXMargin = 9;
    const txtYMargin = 10;
    const txtMargin = txtXMargin + txtYMargin;

    const txtPosX = pageWidth - txtWidth - txtXMargin;
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
    // const imageWidth = pngDims.width;
    // const imageHeight = pngDims.height;
    console.log("This is my image width/height", pngDims.width, pngDims.height);
    const imageWidth = 31;
    const imageHeight = 31;

    // ---------------------------IMAGE HEIGHT/WIDTH -------------------------------

    const imageXMargin = 10;
    const imageYMargin = 18;
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

    // Convert Uint8Array to Blob
    const blob = new Blob([pdfBytes.buffer], { type: "application/pdf" });

    // //  Download feature
    // // Create a URL for the Blob
    // const url = URL.createObjectURL(blob);

    // // Create a temporary link element
    // const link = document.createElement("a");
    // link.href = url;
    // link.download = "pdf-lib_modification_example.pdf";

    // // Append the link to the body
    // document.body.appendChild(link);
    // document.body.appendChild(link);

    // // Trigger the download
    // link.click();
    // link.click();

    // Clean up
    // URL.revokeObjectURL(url);
    // document.body.removeChild(link);
    // End of download feature

    // PDF Viewer
    setPdfViewer(blob, pageNumber);

    // QR Viewer
    setModifiedPDF(blob);
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
        {myQr && <div ref={ref => myQr.append(ref)} />}

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
              {ocrData?.map((data, index) => (
                <p key={index}>{data.data}</p>
              ))}
            </div>
            <div style={{ border: "1px black solid" }}>
              {/* <div ref={qrRef} /> */}
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
