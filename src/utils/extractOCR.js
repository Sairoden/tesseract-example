// UTILS
import {
  getCorrespondenceTypes,
  // getDocumentAbbreviations,
  determineDocumentType,
  // determineDocumentTypeAbbreviation,
  getFormattedDateTime,
  determineDepartment,
  getAcknowledgementReceiptDetails,
  generateOCRData,
  generateDigits,
} from "./index";

export const extractFromInternal = text => {
  const correspondenceType = getCorrespondenceTypes();
  // const documentAbbreviations = getDocumentAbbreviations();

  const documentType = determineDocumentType(text, correspondenceType);
  // const documentTypeAbbreviation = determineDocumentTypeAbbreviation(
  //   text,
  //   documentType,
  //   documentAbbreviations
  // );

  const { formattedDate, formattedTime, splitDate } = getFormattedDateTime();

  const department = determineDepartment(documentType);

  const { referenceNo, arDocumentType, arDocumentDate, isAcknowledgeReceipt } =
    getAcknowledgementReceiptDetails(text);

  const digits = generateDigits();

  // const ctsNo = `${department}-${documentTypeAbbreviation}-${splitDate}-${digits}`;
  // const acknowledgeCts = `${department}-${documentTypeAbbreviation}-${arDocumentType}-${arDocumentDate}-${digits}`;
  // const cts = isAcknowledgeReceipt ? acknowledgeCts : ctsNo;
  const cts = `${department}-${splitDate}-${digits}`;

  const OCRData = generateOCRData({
    formattedDate,
    formattedTime,
    cts,
    department,
    documentType,
    referenceNo,
    isAcknowledgeReceipt,
  });

  return OCRData;
};

// --------------------------------------------------------------------------------

export const extractFromExternal = text => {
  let formNo, licensee, title;

  let cleanedText = text.replace(/CRM FORM/g, "");

  // TITLE
  const titleRegex = /([A-Z\s\/]+ FORM)(?=.*GLDD)/;
  let titleMatch = titleRegex.exec(cleanedText);

  // FORM NO
  const formNoPattern = /([A-Z]+)\s*–\s*(\d+)/;
  const formNoMatch = cleanedText.match(formNoPattern);

  if (formNoMatch && formNoMatch.length === 3) {
    const formCode = formNoMatch[1];
    const formNumber = formNoMatch[2];
    formNo = `${formCode}-${formNumber}`;
  }

  // LICENSEE
  const licenseeMatch = cleanedText.match(
    /Effectivity\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}\s+([A-Za-z\s\/\-]+?)(?=\s{2,}|\n|$)/i
  );

  // Add data from OCR
  formNo = formNo ? formNo : null;
  licensee = licenseeMatch ? licenseeMatch[1].trim() : null;
  // licensee = licensee.toLowerCase().includes("form") ? licensee : null;
  title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : null;

  // Data of formatted date and time
  const currentDate = new Date();

  // Format date part (MM/DD/YYYY)
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  // Format time part (hh:mm AM/PM)
  const hours = currentDate.getHours();
  const minutes = currentDate.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedTime = `${hours === 12 ? 12 : hours % 12}:${minutes
    .toString()
    .padStart(2, "0")} ${ampm}`;

  // Combine date and time parts
  const formattedDateTime = `${formattedDate}, ${formattedTime}`; // Example output: "05/15/2024, 10:48 AM"

  // Data of CTS
  const dateArray = formattedDate.split("/");
  const splitDate = `${dateArray[0]}${dateArray[1]}${dateArray[2]}`;
  const docType = title;

  // Combine data of CTS
  const ctsNo = `${formNo}-${splitDate}-0001`;

  // Data of Department
  const department = formNo?.split("-")[0] || null;

  const OCRData = [
    { data: `Date & Time: ${formattedDateTime}\n`, mode: "byte" },
    { data: `Reference No.: ${ctsNo}`, mode: "byte" },
    { data: `\nLicensee/Applicant: ${licensee}`, mode: "byte" },
    { data: `\nDepartment: ${department}`, mode: "byte" },
    { data: `\nDocument Type: ${docType}`, mode: "byte" },
  ];

  return OCRData;
};

// // SUBJECT
// text = text.replace(/\n\n/g, " ");
// const lines = text.split("\n");
// let subjectLine = "";
// let subjectStarted = false;

// for (let line of lines) {
//   line = line.trim();
//   if (subjectStarted) {
//     // Stop if an empty line, another header, or a sentence-like line is encountered
//     if (line === "" || /^[A-Z ]+ :/.test(line) || /^[A-Z]/.test(line)) {
//       break;
//     } else {
//       subjectLine += " " + line;
//     }
//   } else if (line.startsWith("SUBJECT :")) {
//     subjectStarted = true;
//     subjectLine = line.replace("SUBJECT :", "").trim();
//   }
// }

// const subject = subjectLine?.trim() || null;
