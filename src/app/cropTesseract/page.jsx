"use client";

import { useRef, useState, useEffect } from "react";
import { createWorker } from "tesseract.js";
import cv from "@techstark/opencv-js";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function CropTesseractPage() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const canvasRef = useRef(null);
  const binarizedCanvasRef = useRef(null);
  const imageLoaded = useRef(false);

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
      console.log("Starting OCR process...");

      const worker = await createWorker();

      const { data } = await worker.recognize(img);

      if (data) {
        // console.log(data.lines);
        console.log(data.text);

        // METHOD 1: BY LINES (DEPARTMENT)
        // const departmentTexts = data.lines
        //   .filter(line => {
        //     const words = line.text.toLowerCase().split(/\s+/);
        //     return words.includes("department");
        //   })
        //   .map(line => line.text);

        // departmentTexts.forEach(text => console.log(text.trim()));

        // METHOD 2: BY TEXT (DEPARTMENT/SUBJECT)
        const departmentRegex = /^.*?Department$/im;
        const departmentMatch = text.match(departmentRegex);
        console.log(departmentMatch);
        // const departmentName = departmentMatch ? departmentMatch[0] : null;

        // console.log(departmentName);

        // const subjectRegex = /SUBJECT:\s*(.*)/i;
        // const subjectMatch = text.match(subjectRegex);
        // console.log(subjectMatch);
        // // const subjectName = subjectMatch ? subjectMatch[0] : null;

        console.log("OCR process completed.");
        setText(data.text);
      }
    } catch (error) {
      console.error("Error during OCR process:", error);
    }
  };

  const preprocessAndRunOCR = () => {
    if (!imageLoaded.current) {
      alert("Please load an image first.");
      return;
    }

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

  useEffect(() => {
    if (file) {
      renderPdfToCanvas(file);
    }
  }, [file]);

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept="application/pdf" />
      <button onClick={preprocessAndRunOCR}>Run OCR</button>
      <div>
        <h3>Recognized Text:</h3>
        <pre>{text}</pre>
      </div>
      {file && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h3>Binarized Image:</h3>
          <canvas ref={binarizedCanvasRef}></canvas>
          <canvas ref={canvasRef}></canvas>
        </div>
      )}
    </div>
  );
}
