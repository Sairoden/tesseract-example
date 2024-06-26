"use client";

import { useState, useRef } from "react";
import Tesseract from "tesseract.js";
import Image from "next/image";
// import sharp from "sharp";

export default function TesseractImage() {
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const imageViewerRef = useRef(null);
  const [croppedImage, setCroppedImage] = useState(null);

  const handleFileChange = event => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    setImageUrl(URL.createObjectURL(selectedFile));

    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          const cropHeight = img.height / 2; // Adjust this to crop more or less from the top
          const cropWidth = img.width;
          const dx = 0;
          const dy = 0;

          canvas.width = cropWidth;
          canvas.height = cropHeight;
          ctx.drawImage(
            img,
            dx,
            dy,
            cropWidth,
            cropHeight,
            0,
            0,
            cropWidth,
            cropHeight
          );

          canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            setCroppedImage(url);
          }, "image/jpeg");
        };
        img.src = e.target.result;
      };

      reader.readAsDataURL(file);
    }
  };

  const handleFileRecognition = async () => {
    if (!file) return;

    // if (croppedImage) {
    setLoading(true);
    setText("");

    try {
      const result = await Tesseract.recognize(imageUrl, "eng", {
        logger: m => console.log(m),
      });

      setText(result.data.text);
    } catch (err) {
      console.error(err);
      setText("Error processing the file.");
    } finally {
      setLoading(false);
    }
    // }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept="image/*" />
      <button onClick={handleFileRecognition} disabled={loading}>
        {loading ? "Recognizing..." : "Recognize Text"}
      </button>
      {imageUrl && (
        <div>
          <Image
            src={imageUrl}
            alt="Selected"
            ref={imageViewerRef}
            // style={{ maxWidth: "100%", height: "auto" }}
            width={200}
            height={200}
          />
        </div>
      )}
      <pre>{text}</pre>
    </div>
  );
}
