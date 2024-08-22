// LIBRARIES
import { rgb } from "pdf-lib";
import { createCanvas, loadImage } from "canvas";
import QRCode from "qrcode";

// Utility function to create a customized QR code with logo
export const createQRCode = async (data, logo, qrWidth, qrDataLength) => {
  const canvas = createCanvas(qrWidth, qrWidth);
  const ctx = canvas.getContext("2d");

  await QRCode.toCanvas(canvas, data, {
    errorCorrectionLevel: "H",
    margin: 0,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const dataArr = imageData.data;

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      if (
        dataArr[index] === 0 &&
        dataArr[index + 1] === 0 &&
        dataArr[index + 2] === 0
      ) {
        if (x + y < canvas.width) {
          dataArr[index] = 2;
          dataArr[index + 1] = 62;
          dataArr[index + 2] = 208;
        } else {
          dataArr[index] = 224;
          dataArr[index + 1] = 0;
          dataArr[index + 2] = 1;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const img = await loadImage(logo);
  const minLogoWidth = 30;
  let logoWidth = qrDataLength * 0.8;

  if (logoWidth < minLogoWidth) logoWidth = minLogoWidth;

  const logoHeight = logoWidth;
  const centerX = (canvas.width - logoWidth) / 2;
  const centerY = (canvas.height - logoHeight) / 2;

  ctx.drawImage(img, centerX, centerY, logoWidth, logoHeight);

  return canvas.toDataURL("image/png");
};

// Utility function to embed text in the PDF
export const createQRText = async (
  newPdfDoc,
  text,
  fontSize,
  font,
  posX,
  posY
) => {
  const pages = newPdfDoc.getPages();
  for (const page of pages) {
    page.drawText(text, {
      x: posX,
      y: posY,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0),
    });
  }
};

// Utility function to embed an image in the PDF
export const createQRImage = async (
  firstPage,
  imageUrl,
  imageWidth,
  imageHeight,
  posX,
  posY
) => {
  const pngImageBytes = await fetch(imageUrl).then((res) => res.arrayBuffer());
  const pngImage = await firstPage.doc.embedPng(pngImageBytes);

  firstPage.drawImage(pngImage, {
    x: posX,
    y: posY,
    width: imageWidth,
    height: imageHeight,
  });
};
