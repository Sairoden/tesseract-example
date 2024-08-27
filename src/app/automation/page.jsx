"use client";

// REACT
import { useState } from "react";

// LIBRARIES
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.entry";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { createWorker } from "tesseract.js";
import { PDFDocument } from "pdf-lib";

// UTILS
import { extractFromInternal, embedPdf, embedSupportingPdf } from "../../utils";

// ASSETS
import "./page.css";

// COMPONENTS
import { LoadingScreen } from "../../components";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  pdfjsWorker ||
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function AutomationPage() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [ocrData, setOcrData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [canvasRef, setCanvasRef] = useState(null);
  const [qrData] = useState(
    "https://drive.google.com/drive/folders/1EYxLifM26EhiiCngk3OF9sBI1T72DyYh?usp=sharing"
  );

  const handleTesseract = async img => {
    if (!img) return;

    try {
      const worker = await createWorker();

      const { data } = await worker.recognize(img);

      if (data) {
        const { OCRData } = extractFromInternal(data.text);

        await worker.terminate();

        return OCRData;
      }
    } catch (error) {
      console.error("Error during OCR process:", error);
    }
  };

  const handleOCR = async (imgData, file) => {
    setIsLoading(true);

    const OCRData = await handleTesseract(imgData);

    setOcrData(OCRData);

    // Extract OCR Data
    const extractedOCRData = OCRData[2].data.split(": ")[1];

    // Define parameters for PDF embedding
    const embedParams = {
      qrData,
      file,
      OCRData: extractedOCRData,
    };

    // Embed PDF based on acknowledge receipt status
    const { newPdfDoc, cts } = await embedPdf(embedParams);

    const pdfBytes = await newPdfDoc.save();

    const newFile = new File([pdfBytes], cts, { type: "application/pdf" });

    setIsLoading(false);
    return newFile;
  };

  const handleMainFiles = async event => {
    const files = Array.from(event.target.files);

    const newPdfs = [];

    for (let file of files) {
      // Create a PDF document instance
      const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;

      // Get the first page of the PDF
      const page = await pdf.getPage(1);

      // Set the scale for rendering the PDF page
      const viewport = page.getViewport({ scale: 1.5 });

      // Create a canvas element to render the page
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render the PDF page onto the canvas
      await page.render({ canvasContext: context, viewport: viewport }).promise;

      // Convert the canvas to an image data URL (only for the first page)
      const imgData = canvas.toDataURL("image/png");

      // Perform OCR on the image data (this doesn't alter the original PDF file)
      const newFile = await handleOCR(imgData, file);

      // Store OCR results with the PDF file data
      newPdfs.push({
        main: {
          name: newFile.name,
          oldName: file.name,
          url: URL.createObjectURL(newFile),
          file: newFile,
          imgData,
        },
        supportingDocs: [],
      });
    }

    // Update the state with the new PDF files
    setPdfFiles(prevFiles => [...prevFiles, ...newPdfs]);
  };

  const handleOCRSupportingDocs = async ({ cts, qrData, supportingDocs }) => {
    const updatedSupportingDocs = await Promise.all(
      supportingDocs.map(async file => {
        const embedParams = {
          qrData,
          file,
          cts,
        };

        const { newPdfDoc } = await embedSupportingPdf(embedParams);
        const pdfBytes = await newPdfDoc.save();
        const newFile = new File([pdfBytes], cts, { type: "application/pdf" });

        return {
          oldName: file.name,
          name: newFile.name,
          url: URL.createObjectURL(newFile),
          file: newFile,
        };
      })
    );

    return updatedSupportingDocs;
  };

  const handleSupportingFiles = async (event, index) => {
    const supportingDocs = Array.from(event.target.files);

    const cts = pdfFiles[index].main.name;

    const updatedSupportingDocs = await handleOCRSupportingDocs({
      cts,
      qrData,
      supportingDocs,
    });

    setPdfFiles(prevFiles =>
      prevFiles.map((pdf, i) =>
        i === index
          ? {
              ...pdf,
              supportingDocs: [...pdf.supportingDocs, ...updatedSupportingDocs],
            }
          : pdf
      )
    );
  };

  const resetFiles = () => {
    setPdfFiles([]);
  };

  const handlePreview = fileUrl => {
    window.open(fileUrl, "_blank");
  };

  const exportToZip = async pdfData => {
    const zip = new JSZip();

    // Create a folder using the main PDF's old name without the ".pdf" extension
    const folder = zip.folder(pdfData.main.oldName.replace(".pdf", ""));

    // Add the main document to the folder
    folder.file(`${pdfData.main.name}.pdf`, pdfData.main.file);

    // Add each supporting document to the same folder
    pdfData.supportingDocs.forEach((doc, index) => {
      folder.file(`${doc.name} (${index + 1}).pdf`, doc.file);
    });

    // Generate the zip file and trigger a download
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${pdfData.main.oldName.replace(".pdf", "")}.zip`);
  };

  const handleExport = async index => {
    const pdfData = pdfFiles[index];

    await exportToZip(pdfData);
  };

  const handleExportAll = async () => {
    const zip = new JSZip();

    for (const pdfData of pdfFiles) {
      const folder = zip.folder(pdfData.main.oldName.replace(".pdf", ""));

      // Add main document
      folder.file(`${pdfData.main.name}.pdf`, pdfData.main.file);

      // Add supporting documents
      pdfData.supportingDocs.forEach((doc, index) => {
        folder.file(`${doc.name} (${index + 1}).pdf`, doc.file);
      });
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `PAGCOR_Documents.zip`);
  };

  const handleRemoveMainDoc = index => {
    setPdfFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleRemoveSupportingDoc = (mainIndex, supportingIndex) => {
    setPdfFiles(prevFiles =>
      prevFiles.map((pdf, i) =>
        i === mainIndex
          ? {
              ...pdf,
              supportingDocs: pdf.supportingDocs.filter(
                (_, j) => j !== supportingIndex
              ),
            }
          : pdf
      )
    );
  };

  return (
    <div className="container">
      <LoadingScreen isLoading={isLoading} />

      <div className="file-input-container">
        <label className="file-input-label">Upload main document/s:</label>
        <input
          type="file"
          multiple
          accept="application/pdf"
          onChange={handleMainFiles}
          className="file-input"
        />
        <button onClick={resetFiles} className="reset-button">
          Reset
        </button>
        <button onClick={handleExportAll} className="export-all-button">
          Export All
        </button>
      </div>

      <div className="content-container">
        <ul className="pdf-list">
          {pdfFiles.map((pdf, index) => (
            <li key={index} className="pdf-item">
              <div className="main-doc">
                <div>
                  <div className="main-doc-header">
                    Main Document:
                    <button
                      className="export-button"
                      onClick={() => handleExport(index)}
                    >
                      Export
                    </button>
                  </div>
                  <span
                    className="remove-link"
                    onClick={() => handleRemoveMainDoc(index)}
                  >
                    X
                  </span>
                  <span className="pdf-name">{pdf.main.oldName}</span>
                  <span
                    className="preview-link"
                    onClick={() => handlePreview(pdf.main.url)}
                  >
                    Preview
                  </span>
                </div>

                <div>
                  <label className="file-input-label">
                    Upload supporting document/s:
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="application/pdf"
                    onChange={event => handleSupportingFiles(event, index)}
                    className="supporting-file-input"
                  />
                </div>
              </div>

              {pdf.supportingDocs.length > 0 && (
                <div className="supporting-docs-container">
                  <div className="supporting-docs-header">
                    Supporting Documents:
                  </div>
                  <ul className="supporting-docs-list">
                    {pdf.supportingDocs.map((supportingDoc, i) => (
                      <li key={i} className="supporting-doc">
                        <span
                          className="remove-link"
                          onClick={() => handleRemoveSupportingDoc(index, i)}
                        >
                          X
                        </span>
                        <span className="pdf-name">
                          {supportingDoc.oldName}
                        </span>
                        <span
                          className="preview-link"
                          onClick={() => handlePreview(supportingDoc.url)}
                        >
                          Preview
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
