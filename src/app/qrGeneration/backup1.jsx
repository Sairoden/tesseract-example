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

import logo from "../../assets/images/pagcor_logo.png";

// import logo from "@/";
import { createCanvas, loadImage } from "canvas";

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
  const [base64, setBase64] = useState(null);
  const [qrOutput, setQrOutput] = useState(null);

  useEffect(() => {
    if (file) {
      renderPdfToCanvas(file);
    }
  }, [file]);
  // URL of the PNG image

  // ------------------------------------------------------------
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
      .then((dataUrl) => {
        setBase64(dataUrl);
        console.log(dataUrl);
        // You can use the dataUrl here
      })
      .catch((error) => {
        console.error("Error converting to data URL:", error);
      });
  }, []);

  // ------------------------------------------------------------

  const handleOCR = async () => {
    async function create(dataForQRcode, logo, qrWidth, logoWidth) {
      const canvas = createCanvas(qrWidth, qrWidth);
      const ctx = canvas.getContext("2d");

      await QRCode.toCanvas(canvas, dataForQRcode, {
        errorCorrectionLevel: "H",
        version: 5,
        margin: 0,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      // Load logo image
      const img = await loadImage(logo);

      // Calculate center coordinates for the logo
      // const logoSize = Math.min(qrWidth * 0.2, qrWidth / 4); // Adjust logo size if needed
      const centerX = (qrWidth - logoWidth) / 2;
      const centerY = (qrWidth - logoWidth) / 2;

      // Draw logo onto the QR code
      ctx.drawImage(img, centerX, centerY, logoWidth, logoWidth);

      // const img = await loadImage(logo);
      // const center = qrWidth / 2 - logoWidth;

      // ctx.drawImage(img, center, center, logoWidth, logoWidth);
      return canvas.toDataURL("image/png");
    }

    // console.log(pngUrl);

    const pngImg = base64;
    // const pngImg = `data:image/png;base64, ${pngUrl}`;

    const qrCodeDataURL = await create("https://google.com", pngImg, 150, 50);

    // Use qrCodeDataURL as needed (e.g., display in an <img> tag or save to file)
    console.log(qrCodeDataURL);
    setQrOutput(qrCodeDataURL);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleOCR}
      >
        Generate QR
      </button>
      <img src={qrOutput} alt="" />
    </div>
  );
}
