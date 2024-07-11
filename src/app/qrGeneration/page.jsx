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
      .then(dataUrl => {
        console.log(dataUrl);
        // You can use the dataUrl here
      })
      .catch(error => {
        console.error("Error converting to data URL:", error);
      });
  }, []);

  // ------------------------------------------------------------

  const handleOCR = async () => {
    async function create(dataForQRcode, center_image, width, cwidth) {
      const canvas = createCanvas(width, width);

      await QRCode.toCanvas(canvas, dataForQRcode, {
        errorCorrectionLevel: "H",
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      const ctx = canvas.getContext("2d");
      const img = await loadImage(center_image);
      const center = width / 2 - cwidth;

      ctx.drawImage(img, center, center, cwidth, cwidth);
      return canvas.toDataURL("image/png");
    }

    const pngImg = `data:image/png;base64, ${pngUrl}`;

    const qrCodeDataURL = await create("https://google.com", pngImg, 500, 50);

    // Use qrCodeDataURL as needed (e.g., display in an <img> tag or save to file)
    console.log(qrCodeDataURL);
    setBase64(qrCodeDataURL);
  };

  // Call handleOCR to initiate the process
  // handleOCR();

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleOCR}
      >
        Generate QR
      </button>
      <img src={base64} alt="" />
    </div>
  );
}
