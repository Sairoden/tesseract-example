"use client";

import { useRef, useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import cv from "@techstark/opencv-js";

export default function CropTesseractPage() {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const canvasRef = useRef(null);
  const binarizedCanvasRef = useRef(null);
  const imageRef = useRef(null);

  const handleFileChange = e => {
    const file = e.target.files[0];
    setFile(URL.createObjectURL(file));
  };

  const handleOCR = async img => {
    const worker = await Tesseract.createWorker("eng");
    const { data } = await worker.recognize(img);
    setText(data.text);
  };

  const handleImageLoad = () => {
    const img = imageRef.current;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions to match the image
    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);

    const cropX = 0;
    const cropY = 0;
    const cropWidth = canvas.width;
    const cropHeight = canvas.height * 0.4;

    // const cropX = 0;
    // const cropY = 0;
    // const cropWidth = canvas.width;
    // const cropHeight = canvas.height;

    // const cropX = 800;
    // const cropY = 100;
    // const cropWidth = 400;
    // const cropHeight = 140;

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropWidth, cropHeight);

    // Get the cropped image data
    const imageData = ctx.getImageData(cropX, cropY, cropWidth, cropHeight);

    // Create a temporary canvas to store the cropped image
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.putImageData(imageData, 0, 0);

    let src = cv.imread(tempCanvas);
    let dst = new cv.Mat();

    let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(1, 1));
    // cv.GaussianBlur(src, dst, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
    // cv.cvtColor(src, dst, cv.COLOR_BGR2GRAY, 0);

    // cv.resize(src, dst, dst.size(), 3, 3, cv.INTER_LINEAR);
    cv.resize(src, dst, dst.size(), 2, 2, cv.INTER_LINEAR);

    cv.dilate(src, dst, kernel, new cv.Point(-1, -1));

    let low = new cv.Mat(src.rows, src.cols, src.type(), [0, 0, 0, 0]);
    let high = new cv.Mat(src.rows, src.cols, src.type(), [1, 1, 1, 255]);

    // cv.threshold(src, dst, 50, 200, cv.THRESH_BINARY);
    cv.inRange(src, low, high, dst);

    cv.imshow(binarizedCanvasRef.current, dst);

    // Convert the binarized image back to a data URL
    const binarizedDataUrl = binarizedCanvasRef.current.toDataURL();

    // Run Tesseract.js on the binarized image
    handleOCR(binarizedDataUrl);

    // Clean up
    src.delete();
    dst.delete();
    low.delete();
    high.delete();
  };

  useEffect(() => {
    if (text) {
      const formNoMatch = text.match(/GLDD\s*[-–]\s*\d+/i);

      const newText = {
        formNo: formNoMatch
          ? formNoMatch[0].trim().replace(/\s*[-–]\s*/g, "-")
          : null,
      };

      const documentList = {
        "GLDD-960": {
          title:
            "INSTALLATION AND/OR OPERATIONOF GAMING TABLES NOTIFICATION FORM",
          sections: [
            "SECTION A: OPERATION OF GAMING TABLES",
            "SECTION B: SUBMISSION INSTRUCTIONS",
            "SECTION C: ACKNOWLEDGMENT OF NOTIFICATION",
          ],
        },
        "GLDD-964": {
          title: "NEW GAME REQUEST AND APPROVAL FORM",
          sections: [
            "SECTION A: PROPOSED NEW GAME",
            "SECTION B: SUBMISSION INSTRUCTION",
            "SECTION C: ACTION TAKEN",
          ],
        },
      };

      const newText2 = {
        ...newText,
        title: documentList[newText.formNo]?.title || null,
        sections: documentList[newText.formNo]?.sections || null,
      };

      // console.log(newText2);
    }
  }, [text]);

  return (
    <div>
      <input type="file" onChange={handleFileChange} />

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
          <img
            ref={imageRef}
            src={file}
            alt="Selected"
            onLoad={handleImageLoad}
            style={{ display: "none" }}
          />
          <canvas ref={canvasRef}></canvas>
        </div>
      )}
    </div>
  );
}
