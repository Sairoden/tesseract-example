// LIBRARIES
import { degrees } from "pdf-lib";

export const pageRotation = async (pdfDoc, newPdfDoc, angles) => {
  await Promise.all(
    pdfDoc.getPages().map(async (page, index) => {
      const embedPdfDoc = await newPdfDoc.embedPage(page);
      const embedPdfDocDims = embedPdfDoc.scale(1);
      const PageSizes = [
        [595.28, 841.89], // A4 size in points (portrait)
        [841.89, 595.28], // A4 size in points (landscape)
      ];

      let newPage;

      const pageRotationValue = angles[index];

      // Draw the embedded page with rotation
      if (pageRotationValue === 90) {
        if (page.getWidth() > page.getHeight()) {
          newPage = newPdfDoc.addPage(PageSizes[0]);
        } else {
          newPage = newPdfDoc.addPage(PageSizes[1]);
        }
        newPage.drawPage(embedPdfDoc, {
          ...embedPdfDocDims,
          x: page.getWidth() - embedPdfDocDims.width,
          y: page.getHeight() / 2 + embedPdfDocDims.height,
          rotate: degrees(-90),
        });
      } else if (pageRotationValue === 180) {
        if (page.getWidth() > page.getHeight()) {
          newPage = newPdfDoc.addPage(PageSizes[1]);
        } else {
          newPage = newPdfDoc.addPage(PageSizes[0]);
        }
        newPage.drawPage(embedPdfDoc, {
          ...embedPdfDocDims,
          x: page.getWidth(),
          y: page.getHeight(),
          rotate: degrees(180),
        });
      } else if (pageRotationValue === 270) {
        if (page.getWidth() > page.getHeight()) {
          newPage = newPdfDoc.addPage(PageSizes[0]);
        } else {
          newPage = newPdfDoc.addPage(PageSizes[1]);
        }
        newPage.drawPage(embedPdfDoc, {
          ...embedPdfDocDims,
          x: embedPdfDocDims.height,
          y: page.getHeight() - embedPdfDocDims.height,
          rotate: degrees(-270),
        });
      } else {
        if (page.getWidth() > page.getHeight()) {
          newPage = newPdfDoc.addPage(PageSizes[1]);
        } else {
          newPage = newPdfDoc.addPage(PageSizes[0]);
        }
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
