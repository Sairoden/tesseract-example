// LIBRARIES
import { degrees } from "pdf-lib";

// const CustomPageSizes = {
//   A4_PORTRAIT: [595.28, 841.89],
//   A4_LANDSCAPE: [841.89, 595.28],
//   LETTER_PORTRAIT: [612, 792],
//   LETTER_LANDSCAPE: [792, 612],
//   LEGAL_PORTRAIT: [612, 1008],
//   LEGAL_LANDSCAPE: [1008, 612],
// };

// export const pageRotation = async (pdfDoc, newPdfDoc, angles) => {
//   await Promise.all(
//     pdfDoc.getPages().map(async (page, index) => {
//       const embedPdfDoc = await newPdfDoc.embedPage(page);
//       const embedPdfDocDims = embedPdfDoc.scale(1);

//       const pageRotationValue = angles[index];
//       const pageSize = getPageSize(
//         page.getWidth(),
//         page.getHeight(),
//         pageRotationValue
//       );
//       const newPage = newPdfDoc.addPage(pageSize);

//       if (pageRotationValue === 90 || pageRotationValue === 270) {
//         newPage.drawPage(embedPdfDoc, {
//           ...embedPdfDocDims,
//           x:
//             pageRotationValue === 90
//               ? page.getWidth() - embedPdfDocDims.width
//               : embedPdfDocDims.height,
//           y:
//             pageRotationValue === 90
//               ? page.getHeight() / 2 + embedPdfDocDims.height
//               : page.getHeight() - embedPdfDocDims.height,
//           rotate: degrees(pageRotationValue === 90 ? -90 : -270),
//         });
//       } else {
//         newPage.drawPage(embedPdfDoc, {
//           ...embedPdfDocDims,
//           x: pageRotationValue === 180 ? page.getWidth() : 0,
//           y: pageRotationValue === 180 ? page.getHeight() : 0,
//           rotate: degrees(pageRotationValue),
//         });
//       }

//       return embedPdfDoc;
//     })
//   );
// };

// function getPageSize(width, height, rotation) {
//   const isLandscape = width > height;
//   const rotatedLandscape = rotation === 90 || rotation === 270;
//   const effectiveLandscape = isLandscape !== rotatedLandscape;

//   if (
//     Math.abs(width - CustomPageSizes.A4_PORTRAIT[0]) < 1 &&
//     Math.abs(height - CustomPageSizes.A4_PORTRAIT[1]) < 1
//   )
//     return effectiveLandscape
//       ? CustomPageSizes.A4_LANDSCAPE
//       : CustomPageSizes.A4_PORTRAIT;
//   else if (
//     Math.abs(width - CustomPageSizes.LETTER_PORTRAIT[0]) < 1 &&
//     Math.abs(height - CustomPageSizes.LETTER_PORTRAIT[1]) < 1
//   )
//     return effectiveLandscape
//       ? CustomPageSizes.LETTER_LANDSCAPE
//       : CustomPageSizes.LETTER_PORTRAIT;
//   else if (
//     Math.abs(width - CustomPageSizes.LEGAL_PORTRAIT[0]) < 1 &&
//     Math.abs(height - CustomPageSizes.LEGAL_PORTRAIT[1]) < 1
//   )
//     return effectiveLandscape
//       ? CustomPageSizes.LEGAL_LANDSCAPE
//       : CustomPageSizes.LEGAL_PORTRAIT;
//   // If the page size doesn't match any predefined sizes, use the original dimensions
//   else
//     return effectiveLandscape
//       ? [Math.max(width, height), Math.min(width, height)]
//       : [Math.min(width, height), Math.max(width, height)];
// }

const CustomPageSizes = {
  A4_PORTRAIT: [595.28, 841.89],
  LETTER_PORTRAIT: [612, 792],
  LEGAL_PORTRAIT: [612, 1008],
};

function getPageSize(width, height, rotation) {
  const isLandscape = width > height;
  const rotatedLandscape = rotation === 90 || rotation === 270;
  const effectiveLandscape = isLandscape !== rotatedLandscape;

  // Ensure the page size matches a standard size
  if (
    Math.abs(width - CustomPageSizes.A4_PORTRAIT[0]) < 1 &&
    Math.abs(height - CustomPageSizes.A4_PORTRAIT[1]) < 1
  )
    return effectiveLandscape
      ? CustomPageSizes.A4_PORTRAIT // Use A4 portrait consistently
      : CustomPageSizes.A4_PORTRAIT;
  else if (
    Math.abs(width - CustomPageSizes.LETTER_PORTRAIT[0]) < 1 &&
    Math.abs(height - CustomPageSizes.LETTER_PORTRAIT[1]) < 1
  )
    return effectiveLandscape
      ? CustomPageSizes.LETTER_PORTRAIT
      : CustomPageSizes.LETTER_PORTRAIT;
  else if (
    Math.abs(width - CustomPageSizes.LEGAL_PORTRAIT[0]) < 1 &&
    Math.abs(height - CustomPageSizes.LEGAL_PORTRAIT[1]) < 1
  )
    return effectiveLandscape
      ? CustomPageSizes.LEGAL_PORTRAIT
      : CustomPageSizes.LEGAL_PORTRAIT;

  // Fallback: maintain original dimensions if no match
  return [width, height];
}

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

// export const pageRotation = async (pdfDoc, newPdfDoc, angles) => {
//   await Promise.all(
//     pdfDoc.getPages().map(async (page, index) => {
//       const embedPdfDoc = await newPdfDoc.embedPage(page);
//       const embedPdfDocDims = embedPdfDoc.scale(1);

//       const pageRotationValue = angles[index]; // You are rotating pages here
//       const pageSize = getPageSize(
//         page.getWidth(),
//         page.getHeight(),
//         pageRotationValue
//       );
//       const newPage = newPdfDoc.addPage(pageSize);

//       // Temporarily disable rotation for testing
//       // Keep it simple with no rotation to see if it fixes recognition
//       newPage.drawPage(embedPdfDoc, {
//         ...embedPdfDocDims,
//         x: 0,
//         y: 0,
//         rotate: degrees(0), // No rotation
//       });

//       return embedPdfDoc;
//     })
//   );
// };
