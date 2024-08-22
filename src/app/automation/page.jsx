"use client";

// REACT
import { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// ASSETS
import "./page.css";

export default function AutomationPage() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [cts, setCts] = useState(null);
  const [ocrData, setOcrData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [canvasRef, setCanvasRef] = useState(null);

  const handleTesseract = async img => {
    if (!img) return;

    try {
      const worker = await createWorker();

      const { data } = await worker.recognize(img);

      if (data) {
        const { OCRData } = extractFromInternal(data.text);

        return { OCRData };
      }
    } catch (error) {
      console.error("Error during OCR process:", error);
    }
  };

  const handleOCR = async canvasRef => {
    if (!file || !canvasRef) return;

    setIsLoading(true);

    setCanvasRef(canvasRef);

    const canvasDataUrl = canvasRef.current.toDataURL();

    const { OCRData } = await handleTesseract(canvasDataUrl);

    setOcrData(OCRData);

    let qrData =
      "https://drive.google.com/drive/folders/1EYxLifM26EhiiCngk3OF9sBI1T72DyYh?usp=sharing";

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

    setCts(cts);

    if (files.length > 0 && cts) handleOCRSupportingDocs({ cts, qrData });

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await newPdfDoc.save();

    const newFile = new File([pdfBytes], cts, { type: file.type });
    setFile(newFile);

    setIsLoading(false);
  };

  const handleOCRSupportingDocs = async ({ cts, qrData }) => {
    if (files.length === 0 || !cts) return;

    const modifiedFiles = Array.from(files).map(file => {
      return new File([file], `${cts}`, { type: file.type });
    });

    const newFiles = [];

    for (let file of modifiedFiles) {
      // Define parameters for PDF embedding
      const embedParams = {
        qrData,
        file,
        cts,
      };

      const { newPdfDoc } = await embedSupportingPdf(embedParams);

      const pdfBytes = await newPdfDoc.save();
      const newFile = new File([pdfBytes], cts, { type: file.type });

      newFiles.push(newFile);
    }

    setFiles(newFiles);
  };

  const handleMainFiles = async event => {
    const files = Array.from(event.target.files);
    const newPdfs = files.map(file => ({
      main: { name: file.name, url: URL.createObjectURL(file), file },
      supportingDocs: [],
    }));

    setPdfFiles(prevFiles => [...prevFiles, ...newPdfs]);
  };

  const handleSupportingFiles = (event, index) => {
    const files = Array.from(event.target.files);
    const supportingDocs = files.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file),
      file,
    }));

    setPdfFiles(prevFiles =>
      prevFiles.map((pdf, i) =>
        i === index
          ? {
              ...pdf,
              supportingDocs: [...pdf.supportingDocs, ...supportingDocs],
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
    const folder = zip.folder(pdfData.main.name.replace(".pdf", ""));

    // Add main document
    folder.file(pdfData.main.name, pdfData.main.file);

    // Add supporting documents
    pdfData.supportingDocs.forEach(doc => {
      folder.file(doc.name, doc.file);
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `${pdfData.main.name.replace(".pdf", "")}.zip`);
  };

  const handleExport = async index => {
    const pdfData = pdfFiles[index];
    await exportToZip(pdfData);
  };

  const handleExportAll = async () => {
    const zip = new JSZip();

    for (const pdfData of pdfFiles) {
      const folder = zip.folder(pdfData.main.name.replace(".pdf", ""));

      // Add main document
      folder.file(pdfData.main.name, pdfData.main.file);

      // Add supporting documents
      pdfData.supportingDocs.forEach(doc => {
        folder.file(doc.name, doc.file);
      });
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `all_documents.zip`);
  };

  return (
    <div className="container">
      <canvas ref={canvasRef} style={{ opacity: "0" }}></canvas>
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
                  <div className="main-doc-header">Main Document:</div>
                  <span className="pdf-name">{pdf.main.name}</span>
                  <span
                    className="preview-link"
                    onClick={() => handlePreview(pdf.main.url)}
                  >
                    Preview
                  </span>
                  <button
                    className="export-button"
                    onClick={() => handleExport(index)}
                  >
                    Export
                  </button>
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
                        <span className="pdf-name">{supportingDoc.name}</span>
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
