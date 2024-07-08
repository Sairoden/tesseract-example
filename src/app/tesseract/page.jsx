"use client";

// REACT
import { useRef, useState, useEffect } from "react";

// LIBRARIES
import { createWorker } from "tesseract.js";
import cv from "@techstark/opencv-js";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

// UTILS
import { extractInternalOCR } from "../../utils";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  pdfjsWorker ||
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function Tesseract() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef(null);
  const binarizedCanvasRef = useRef(null);
  const imageLoaded = useRef(false);

  useEffect(() => {
    if (file) {
      renderPdfToCanvas(file);
    }
  }, [file]);

  const handleFileChange = e => {
    const file = e.target.files[0];

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

  const handleOCR = async img => {
    try {
      setIsLoading(true);

      const worker = await createWorker();

      const { data } = await worker.recognize(img);

      if (data) {
        const OCRData = extractInternalOCR(data.text);

        console.log(OCRData);

        setText(data.text);
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

    // cv.inRange(src, low, high, dst);

    cv.imshow(binarizedCanvasRef.current, dst);

    const binarizedDataUrl = binarizedCanvasRef.current.toDataURL();

    handleOCR(binarizedDataUrl);

    src.delete();
    dst.delete();
    low.delete();
    high.delete();
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
          onClick={handleClick}
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
    </div>
  );
}
