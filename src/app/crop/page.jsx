"use client";
import { useState, useCallback } from "react";

import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

export default function CropPage() {
  const [croppedImage, setCroppedImage] = useState(null);

  const handleImageUpload = event => {
    const file = event.target.files[0];
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

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {croppedImage && (
        <div>
          <h3>Cropped Image:</h3>
          <img src={croppedImage} alt="Cropped" />
        </div>
      )}
    </div>
  );
}
