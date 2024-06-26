"use client";
import React, { useState, useEffect } from "react";
import pdfToText from "react-pdftotext";

export default function PDFToText() {
  const [text, setText] = useState("");

  const extractText = event => {
    const file = event.target.files[0];
    pdfToText(file)
      .then(text => setText(text))
      .catch(error => console.error("Failed to extract text from pdf", error));
  };

  useEffect(() => {
    if (text) {
      // const formNoMatch = text.match(/GLDD\s*[-–]\s*\d+/i);

      const formNoPattern = /([A-Z]+)\s*–\s*(\d+)/;

      // Match the pattern in the text
      const formNoMatch = text.match(formNoPattern);
      let formNo;

      // Check if a match is found and extract the data
      if (formNoMatch && formNoMatch.length === 3) {
        const formCode = formNoMatch[1];
        const formNumber = formNoMatch[2];

        formNo = `${formCode}-${formNumber}`;
      }
      console.log(text);

      // const revisionNoMatch = text.match(/Revision\s*No\.\s*(\d+)/i);
      // const effectivityMatch = text.match(
      //   /Effectivity\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})/i
      // );
      // const licenseeMatch = text.match(
      //   /Effectivity\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}\s+([^\s]+)/i
      // );
      // const licenseeDateMatch = text.match(
      //   /Effectivity\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}\s+([^\s]+)\s+([\d\/-]+\s*[\d\/-]*|[A-Za-z]+\s+\d{1,2},\s+\d{4})/i
      // );

      // const newText = {
      //   formNo: formNo ? formNo : null,
      //   revisionNo: revisionNoMatch ? revisionNoMatch[1].trim() : null,
      //   effectivity: effectivityMatch ? effectivityMatch[1].trim() : null,
      //   licensee: licenseeMatch ? licenseeMatch[1].trim() : null,
      //   licenseeDate: licenseeDateMatch ? licenseeDateMatch[2].trim() : null,
      // };

      // const documentList = {
      //   "GLDD-960": {
      //     title:
      //       "INSTALLATION AND/OR OPERATION OF GAMING TABLES NOTIFICATION FORM",
      //     sections: [
      //       "SECTION A: OPERATION OF GAMING TABLES",
      //       "SECTION B: SUBMISSION INSTRUCTIONS",
      //       "SECTION C: ACKNOWLEDGMENT OF NOTIFICATION",
      //     ],
      //   },
      //   "GLDD-964": {
      //     title: "NEW GAME REQUEST AND APPROVAL FORM",
      //     sections: [
      //       "SECTION A: PROPOSED NEW GAME",
      //       "SECTION B: SUBMISSION INSTRUCTION",
      //       "SECTION C: ACTION TAKEN",
      //     ],
      //   },
      // };

      // const newText2 = {
      //   ...newText,
      //   title: documentList[newText.formNo]?.title || null,
      //   sections: documentList[newText.formNo]?.sections || null,
      // };

      // console.log(newText2);
    }
  }, [text]);

  return (
    <div className="App">
      <h1 className="text-green-500 text-7xl">Hello Me</h1>
      <header className="App-header">
        <label htmlFor="pdf" className="text-7xl">
          Upload your PDF
        </label>
        <input
          id="pdf"
          className="p-3 text-lg text-white bg-blue-500 border-none rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          type="file"
          accept="application/pdf"
          onChange={extractText}
        />
        <pre>{text}</pre>
      </header>
    </div>
  );
}
