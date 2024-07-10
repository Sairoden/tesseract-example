// LIBRARIES
import { degrees } from "pdf-lib";

export const pageRotation = async (pdfDoc, newPdfDoc, angles) => {
  await Promise.all(
    pdfDoc.getPages().map(async (page, index) => {
      const embedPdfDoc = await newPdfDoc.embedPage(page);
      const embedPdfDocDims = embedPdfDoc.scale(1);
      const newPage = newPdfDoc.addPage();
      const pageRotationValue = angles[index];

      // Draw the embedded page with rotation
      if (pageRotationValue === 90) {
        newPage.drawPage(embedPdfDoc, {
          ...embedPdfDocDims,
          x: page.getWidth() - embedPdfDocDims.width,
          y: page.getHeight() / 2 + embedPdfDocDims.height,
          rotate: degrees(-90),
        });
      } else if (pageRotationValue === 180) {
        newPage.drawPage(embedPdfDoc, {
          ...embedPdfDocDims,
          x: page.getWidth(),
          y: page.getHeight(),
          rotate: degrees(180),
        });
      } else if (pageRotationValue === 270) {
        newPage.drawPage(embedPdfDoc, {
          ...embedPdfDocDims,
          x: embedPdfDocDims.height,
          y: page.getHeight() - embedPdfDocDims.height,
          rotate: degrees(-270),
        });
      } else {
        // Handle other rotation angles if needed
        newPage.drawPage(embedPdfDoc, {
          ...embedPdfDocDims,
          x: 0,
          y: 0,
          rotate: degrees(pageRotationValue),
        });
      }

      return embedPdfDoc;
    })
  );
};
