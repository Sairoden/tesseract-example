// REACT
import { useState } from "react";

// LIBRARIES
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// UTILS
import { pageRotation } from "../utils";

export default function SupportingDocs({ cts, qrImage }) {
  const [inputFiles, setInputFiles] = useState([]);

  const handleFilesChange = async e => {
    const files = e.target.files;

    const modifiedFiles = Array.from(files).map(file => {
      return new File([file], `${cts}`, { type: file.type });
    });

    setInputFiles(modifiedFiles);

    for (let file of modifiedFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      const angles = pdfDoc.getPages().map(page => {
        const rotation = page.getRotation().angle;

        return rotation;
      });

      // -----------------------------------------------------------------------------
      // Create a new PDFDocument
      const newPdfDoc = await PDFDocument.create();

      await pageRotation(pdfDoc, newPdfDoc, angles);

      const rotatedPages = newPdfDoc.getPages();
      const firstPage = rotatedPages[0];

      // Embed an image to the first page
      const pngImage = await pdfDoc.embedPng(qrImage);

      const pageWidth = firstPage.getWidth();

      const boldHelveticaFont = await newPdfDoc.embedFont(
        StandardFonts.HelveticaBold
      );

      // Calculate the position to place the text in the upper right corner
      const txtWidth = boldHelveticaFont.widthOfTextAtSize(cts, 8);
      const txtXMargin = 9;
      const txtYMargin = 10;

      const txtPosX = pageWidth - txtWidth - txtXMargin;
      const txtPosY = txtYMargin;

      newPdfDoc.getPages().map(async page => {
        page.drawText(cts, {
          x: txtPosX,
          y: txtPosY,
          size: 8,
          font: boldHelveticaFont,
          color: rgb(0, 0, 0),
        });
      });

      const imageWidth = 35;
      const imageHeight = 35;

      const imageXMargin = 10;
      const imageYMargin = 18;

      const imagePosX = pageWidth - imageWidth - imageXMargin;
      const imagePosY = imageYMargin;

      firstPage.drawImage(pngImage, {
        x: imagePosX,
        y: imagePosY,
        width: imageWidth,
        height: imageHeight,
      });

      const pdfBytes = await newPdfDoc.save();
      const newFile = new File([pdfBytes], file.name, { type: file.type });

      const url = URL.createObjectURL(newFile);
      const a = document.createElement("a");
      a.href = url;
      a.download = newFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };
  return (
    <div className="flex items-center space-x-4">
      <h1 className="text-4xl text-blue-400">Supporting Docs</h1>
      <input
        type="file"
        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        accept="application/pdf"
        onChange={handleFilesChange}
        multiple
      />

      <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
        Submit
      </button>
    </div>
  );
}
