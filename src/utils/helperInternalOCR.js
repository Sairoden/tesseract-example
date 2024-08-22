export const getCorrespondenceTypes = () => [
  "Inter-office Memorandum",
  "Board Recommendation",
  "Message from the CEO/COO/Board",
  "Announcement",
  "Templated forms",
  "Business Letter",
  "Letter from Government Agencies/Instrumentalities/GOCCs/LGUs",
  "Confidential letter",
  "Others",
  "Acknowledgement Receipt",
];

export const getDocumentAbbreviations = () => ({
  "Inter-office Memorandum": "IOM",
  "Board Recommendation": "BR",
  "Message from the CEO/COO/Board": "MC",
  Announcement: "A",
  "Templated forms": "TF",
  "Business Letter": "BL",
  "Letter from Government Agencies/Instrumentalities/GOCCs/LGUs": "LGA",
  "Confidential letter": "CL",
  Others: "O",
  GOCC: "GOCC",
  LGU: "LGU",
  Instrumentalities: "I",
  "Acknowledgement Receipt": "AR",
});

export const determineDocumentType = (text, correspondenceType) => {
  if (text.toUpperCase().includes("ACKNOWLEDGEMENT RECEIPT"))
    return correspondenceType.find(type => type === "Acknowledgement Receipt");
  else if (text.includes("Dear") && text.includes("GOCC"))
    return correspondenceType.find(
      type =>
        type === "Letter from Government Agencies/Instrumentalities/GOCCs/LGUs"
    );
  else if (text.includes("Dear"))
    return correspondenceType.find(type => type === "Business Letter");
  else if (text.includes("Recommendation"))
    return correspondenceType.find(type => type === "Board Recommendation");
  else if (text.includes("MEMORANDUM"))
    return correspondenceType.find(type => type === "Inter-office Memorandum");
  else if (text.toLowerCase().includes("template"))
    return correspondenceType.find(type => type === "Templated forms");
  else return correspondenceType.find(type => type === "Others");
};

export const determineDocumentTypeAbbreviation = (
  text,
  documentType,
  documentAbbreviations
) => {
  if (text.toUpperCase().includes("ACKNOWLEDGEMENT RECEIPT"))
    return documentAbbreviations["Acknowledgement Receipt"];
  else if (text.includes("GOCC")) return documentAbbreviations["GOCC"];
  else if (text.includes("LGU")) return documentAbbreviations["LGU"];
  else if (text.includes("Instrumentalities"))
    return documentAbbreviations["Instrumentalities"];
  else return documentAbbreviations[documentType];
};

export const getFormattedDateTime = () => {
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  const formattedTime = currentDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const dateArray = formattedDate.split("/");
  const splitDate = `${dateArray[0]}${dateArray[1]}${dateArray[2]}`;

  return { formattedDate, formattedTime, splitDate };
};

export const determineDepartment = documentType => {
  if (documentType === "Acknowledgement Receipt") return "CRA";
  else if (
    documentType ===
    "Letter from Government Agencies/Instrumentalities/GOCCs/LGUs"
  )
    return "CRA";
  else return "RMD";
};

export const getAcknowledgementReceiptDetails = text => {
  const referenceNumberRegex = /Document Reference No:\s*([a-zA-Z0-9-]+)/i;
  const match = text.match(referenceNumberRegex);

  let referenceNo = null;
  let arDocumentType = null;
  let arDocumentDate = null;
  let isAcknowledgeReceipt = null;

  if (match && match[1]) {
    const documentReferenceNumber = match[1];
    const parts = documentReferenceNumber.split("-");

    if (parts.length >= 3) {
      referenceNo = documentReferenceNumber;
      arDocumentType = parts[1];
      arDocumentDate = parts[2];
      isAcknowledgeReceipt = true;
    }
  }

  return { referenceNo, arDocumentType, arDocumentDate, isAcknowledgeReceipt };
};

export const generateOCRData = ({
  formattedDate,
  formattedTime,
  cts,
  department,
  documentType,
  referenceNo,
  isAcknowledgeReceipt,
}) => ({
  OCRData: [
    { data: `Submission Date: ${formattedDate}\n`, mode: "byte" },
    { data: `Submission Time: ${formattedTime}\n`, mode: "byte" },
    { data: `CTS No.: ${cts}`, mode: "byte" },
    { data: `\nDepartment: ${department}`, mode: "byte" },
    { data: `\nDocument Type: ${documentType}`, mode: "byte" },
  ],
  referenceNo,
  isAcknowledgeReceipt,
});

export const generateDigits = () => {
  const uniqueNumbers = new Set();

  while (uniqueNumbers.size < 1) {
    const randomNumber = Math.floor(Math.random() * 9000) + 1000;

    uniqueNumbers.add(randomNumber);
  }

  return Array.from(uniqueNumbers)[0];
};
