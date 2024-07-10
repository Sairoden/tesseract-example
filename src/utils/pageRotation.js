

export async function pageRotation(pdfDoc, newPdfDoc, angles) {
  // Ensure pdfDoc, newPdfDoc, and angles are passed as arguments to the function

  // Process pages using Promise.all to await all page transformations
  await Promise.all(
    pdfDoc.getPages().map(async (page, index) => {
      const embedPdfDoc = await newPdfDoc.embedPage(page);
      const embedPdfDocDims = embedPdfDoc.scale(1);
      const newPage = newPdfDoc.addPage();
      const pageRotation = angles[index];

      // Draw the embedded page with rotation
      if (pageRotation === 90) {
        newPage.drawPage(embedPdfDoc, {
          ...embedPdfDocDims,
          x: page.getWidth() - embedPdfDocDims.width,
          y: page.getHeight() / 2 + embedPdfDocDims.height,
          rotate: degrees(-90),
        });
      } else if (pageRotation === 180) {
        newPage.drawPage(embedPdfDoc, {
          ...embedPdfDocDims,
          x: page.getWidth(),
          y: page.getHeight(),
          rotate: degrees(180),
        });
      } else if (pageRotation === 270) {
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
          rotate: degrees(pageRotation),
        });
      }
      console.log(
        "pdfWidth: ",
        embedPdfDocDims.width,
        " pdfHeight: ",
        embedPdfDocDims.height
      );
      return embedPdfDoc;
    })
  );
}

// await Promise.all(
//     pdfDoc.getPages().map(async (page, index) => {
//       const embedPdfDoc = await newPdfDoc.embedPage(page);
//       const embedPdfDocDims = embedPdfDoc.scale(1);
//       const newPage = newPdfDoc.addPage();
//       const pageRotation = angles[index];

//       // Draw the embedded page with rotation
//       if (pageRotation === 90) {
//         newPage.drawPage(embedPdfDoc, {
//           ...embedPdfDocDims,
//           x: page.getWidth() - embedPdfDocDims.width,
//           y: page.getHeight() / 2 + embedPdfDocDims.height,
//           rotate: degrees(-90),
//         });
//       } else if (pageRotation === 180) {
//         newPage.drawPage(embedPdfDoc, {
//           ...embedPdfDocDims,
//           x: page.getWidth(),
//           y: page.getHeight(),
//           rotate: degrees(180),
//         });
//       } else if (pageRotation === 270) {
//         newPage.drawPage(embedPdfDoc, {
//           ...embedPdfDocDims,
//           x: embedPdfDocDims.height,
//           y: page.getHeight() - embedPdfDocDims.height,
//           rotate: degrees(-270),
//         });
//       } else {
//         // Handle other rotation angles if needed
//         newPage.drawPage(embedPdfDoc, {
//           ...embedPdfDocDims,
//           x: 0,
//           y: 0,
//           rotate: degrees(pageRotation),
//         });
//       }
//       console.log(
//         "pdfWidth: ",
//         embedPdfDocDims.width,
//         " pdfHeight: ",
//         embedPdfDocDims.height
//       );
//       return embedPdfDoc;
//     })
//   );
