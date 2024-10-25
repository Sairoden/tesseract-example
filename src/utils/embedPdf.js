// LIBRARIES
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// UTILS
import {
  pageRotation,
  createQRCode,
  createQRText,
  createQRImage,
} from "./index";

// PUBLIC
import logo from "../assets/images/pagcor.png";

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

// // --------------------------------------------------------------------------------------------------------
// // NORMAL EMBEDDING DESIGN
// export const embedPdf = async ({ qrData, file, OCRData }) => {
//   const logoDataUrl = await getDataUrl(logo.src);
//   const qrCodeDataUrl = await createQRCode(
//     qrData,
//     logoDataUrl,
//     150,
//     qrData.length
//   );

//   const pdfBuffer = await file.arrayBuffer();
//   const pdfDoc = await PDFDocument.load(pdfBuffer);

//   const angles = pdfDoc.getPages().map(page => page.getRotation().angle);
//   const newPdfDoc = await PDFDocument.create();

//   await pageRotation(pdfDoc, newPdfDoc, angles);

//   const rotatedPages = newPdfDoc.getPages(); // Get all pages
//   const boldHelveticaFont = await newPdfDoc.embedFont(
//     StandardFonts.HelveticaBold
//   );
//   const textValue = OCRData;

//   // Loop through all the pages to apply text and background
//   rotatedPages.forEach(page => {
//     const pageWidth = page.getWidth();
//     const pageHeight = page.getHeight();

//     // const imagePosX = 5;
//     // const imagePosY = pageHeight - 47;

//     // Commented out QR image embedding for now
//     // await createQRImage(page, qrCodeDataUrl, 35, 35, imagePosX, imagePosY);

//     const txtWidth = boldHelveticaFont.widthOfTextAtSize(textValue, 8);

//     // Position text in the upper-left corner of each page
//     const txtPosX = 5;
//     const txtPosY = pageHeight - 10;

//     // Draw a white rectangle (or document background color) behind the text on each page
//     page.drawRectangle({
//       x: txtPosX - 5, // Adjust position for padding
//       y: txtPosY - 6, // Adjust position for padding
//       width: txtWidth + 6, // Adjust width for padding
//       height: 16, // Adjust height as needed
//       color: rgb(1, 1, 1), // White background to cover any lines or scratches
//       opacity: 1.0, // Fully opaque to cover any scratches or marks behind
//     });

//     // Draw the text on each page
//     page.drawText(textValue, {
//       x: txtPosX,
//       y: txtPosY,
//       size: 8,
//       font: boldHelveticaFont,
//     });
//   });

//   return { newPdfDoc, qrImage: qrCodeDataUrl, cts: textValue };
// };

// --------------------------------------------------------------------------------
// FIRST PAGE EMBED ONLY

export const embedPdf = async ({ qrData, file, OCRData }) => {
  const logoDataUrl = await getDataUrl(logo.src);
  const qrCodeDataUrl = await createQRCode(
    qrData,
    logoDataUrl,
    150,
    qrData.length
  );

  const pdfBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  const angles = pdfDoc.getPages().map(page => page.getRotation().angle);
  const newPdfDoc = await PDFDocument.create();

  await pageRotation(pdfDoc, newPdfDoc, angles);

  const rotatedPages = newPdfDoc.getPages(); // Get all pages
  const boldHelveticaFont = await newPdfDoc.embedFont(
    StandardFonts.HelveticaBold
  );
  const textValue = OCRData;

  // Only apply text and background to the first page
  if (rotatedPages.length > 0) {
    const firstPage = rotatedPages[0];
    const pageWidth = firstPage.getWidth();
    const pageHeight = firstPage.getHeight();

    const txtWidth = boldHelveticaFont.widthOfTextAtSize(textValue, 8);

    // Position text in the upper-left corner of the first page
    const txtPosX = 5;
    const txtPosY = pageHeight - 10;

    // Draw a white rectangle (or document background color) behind the text on the first page
    firstPage.drawRectangle({
      x: txtPosX - 5, // Adjust position for padding
      y: txtPosY - 6, // Adjust position for padding
      width: txtWidth + 6, // Adjust width for padding
      height: 16, // Adjust height as needed
      color: rgb(1, 1, 1), // White background to cover any lines or scratches
      opacity: 1.0, // Fully opaque to cover any scratches or marks behind
    });

    // Draw the text on the first page
    firstPage.drawText(textValue, {
      x: txtPosX,
      y: txtPosY,
      size: 8,
      font: boldHelveticaFont,
    });
  }

  return { newPdfDoc, qrImage: qrCodeDataUrl, cts: textValue };
};

// --------------------------------------------------------------------------------------------------------
// SPECIAL EMBEDDING DESGIN FOR ACKNOWLEDGEMENT RECEIPT
export const embedAcknowledgePdf = async ({
  qrData,
  file,
  OCRData,
  referenceNo,
}) => {
  const logoDataUrl = await getDataUrl(logo.src);
  const qrCodeDataUrl = await createQRCode(
    qrData,
    logoDataUrl,
    150,
    qrData.length
  );
  const pdfBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  const angles = pdfDoc.getPages().map(page => page.getRotation().angle);
  const newPdfDoc = await PDFDocument.create();

  await pageRotation(pdfDoc, newPdfDoc, angles);

  const rotatedPages = newPdfDoc.getPages();
  const firstPage = rotatedPages[0];
  const pageWidth = firstPage.getWidth();
  const imagePosX = pageWidth - 90 - 77;
  const imagePosY = 103;

  await createQRImage(firstPage, qrCodeDataUrl, 90, 90, imagePosX, imagePosY);

  const boldHelveticaFont = await newPdfDoc.embedFont(
    StandardFonts.HelveticaBold
  );
  const helveticaFont = await newPdfDoc.embedFont(StandardFonts.Helvetica);
  const textValue = referenceNo;
  const rectangleTitle = "In following-up, please cite CTS ref #";

  const rectangleTitleWidth = helveticaFont.widthOfTextAtSize(
    rectangleTitle,
    10
  );
  const ctsTextWidth = boldHelveticaFont.widthOfTextAtSize(textValue, 10);
  const rectangleWidth = Math.max(rectangleTitleWidth, ctsTextWidth) + 16;
  const rectangleHeight = 35;

  const qrCenterX = imagePosX + 90 / 2;
  const rectanglePosX = qrCenterX - rectangleWidth / 2;
  const rectanglePosY = imagePosY - 37;

  firstPage.drawRectangle({
    x: rectanglePosX,
    y: rectanglePosY,
    width: rectangleWidth,
    height: rectangleHeight,
    borderColor: rgb(0, 0, 0),
    borderWidth: 0.5,
  });

  const rectangleTitlePosX =
    rectanglePosX + (rectangleWidth - rectangleTitleWidth) / 2;
  const rectangleTitlePosY = rectanglePosY + 20;

  firstPage.drawText(rectangleTitle, {
    x: rectangleTitlePosX,
    y: rectangleTitlePosY,
    size: 10,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  const txtPosX = rectanglePosX + (rectangleWidth - ctsTextWidth) / 2;
  const txtPosY = rectanglePosY + 5;

  firstPage.drawText(textValue, {
    x: txtPosX,
    y: txtPosY,
    size: 10,
    font: boldHelveticaFont,
    color: rgb(0, 0, 0),
  });

  // const ocrValue = OCRData;
  // const ocrValue = OCRData;

  // const ctsTxtWidth = boldHelveticaFont.widthOfTextAtSize(ocrValue, 8);
  // const ctsTxtPosX = pageWidth - ctsTxtWidth - 9;
  // const ctsTxtPosY = 10;

  // await createQRText(
  //   newPdfDoc,
  //   ocrValue,
  //   8,
  //   boldHelveticaFont,
  //   ctsTxtPosX,
  //   ctsTxtPosY
  // );

  // return { newPdfDoc, qrImage: qrCodeDataUrl, cts: ocrValue };

  return { newPdfDoc, qrImage: qrCodeDataUrl };
};

// --------------------------------------------------------------------------------------------------------
// SUPPORTING DOCUMENT DESIGN
export const embedSupportingPdf = async ({ qrData, file, cts }) => {
  const logoDataUrl = await getDataUrl(logo.src);
  const qrCodeDataUrl = await createQRCode(
    qrData,
    logoDataUrl,
    150,
    qrData.length
  );
  const pdfBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  const angles = pdfDoc.getPages().map(page => page.getRotation().angle);
  const newPdfDoc = await PDFDocument.create();

  await pageRotation(pdfDoc, newPdfDoc, angles);

  const rotatedPages = newPdfDoc.getPages();
  const firstPage = rotatedPages[0];
  const pageWidth = firstPage.getWidth();
  const pageHeight = firstPage.getHeight(); // Get the page height
  // const imagePosX = pageWidth - 35 - 10;
  // const imagePosY = 18;
  const imagePosX = 5; // 10 units from the left edge
  const imagePosY = pageHeight - 47;

  await createQRImage(firstPage, qrCodeDataUrl, 35, 35, imagePosX, imagePosY);

  const boldHelveticaFont = await newPdfDoc.embedFont(
    StandardFonts.HelveticaBold
  );
  const textValue = cts;

  const txtWidth = boldHelveticaFont.widthOfTextAtSize(textValue, 8);
  // const txtPosX = pageWidth - txtWidth - 9;
  // const txtPosY = 10;
  const txtPosX = 5; // 10 units from the left edge
  const txtPosY = imagePosY + 37; // Position text above the image

  await createQRText(
    newPdfDoc,
    textValue,
    8,
    boldHelveticaFont,
    txtPosX,
    txtPosY
  );

  return { newPdfDoc, qrImage: qrCodeDataUrl, cts: textValue };
};
