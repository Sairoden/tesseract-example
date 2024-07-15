export const extractFromInternal = text => {
  const correspondenceType = [
    "Inter-office Memorandum",
    "Board Recommendation",
    "Message from the CEO/COO/Board",
    "Announcement",
    "Templated forms",
    "Business Letter",
    "Letter from Government Agencies/Instrumentalities/GOCCs/LGUs",
    "Confidential letter",
    "Others",
  ];

  const documentAbbreviations = {
    "Inter-office Memorandum": "IOM",
    "Board Recommendation": "BR",
    "Message from the CEO/COO/Board": "MC",
    Announcement: "A",
    "Templated forms": "TF",
    "Business Letter": "BL",
    "Letter from Government Agencies/Instrumentalities/GOCCs/LGUs": "LGA",
    "Confidential letter": "CL",
    Others: "O",
  };

  // DOCUMENT TYPES
  let documentType;

  if (text.includes("Dear") && text.includes("GOCC")) {
    documentType = correspondenceType.find(
      type =>
        type === "Letter from Government Agencies/Instrumentalities/GOCCs/LGUs"
    );
  } else if (text.includes("Dear")) {
    documentType = correspondenceType.find(type => type === "Business Letter");
  } else if (text.includes("Recommendation")) {
    documentType = correspondenceType.find(
      type => type === "Board Recommendation"
    );
  } else if (text.includes("MEMORANDUM")) {
    documentType = correspondenceType.find(
      type => type === "Inter-office Memorandum"
    );
  } else if (text.toLowerCase().includes("template")) {
    documentType = correspondenceType.find(type => type === "Templated forms");
  } else {
    documentType = correspondenceType.find(type => type === "Others");
  }

  // ABBREVIATED DOCUMENT TYPES
  let documentTypeAbreviation = documentAbbreviations[documentType];

  // DEPARTMENT
  const departmentRegex = /^.*?Department$/im;
  const departmentMatch = text.match(departmentRegex);
  const departmentName = departmentMatch ? departmentMatch[0] : null;
  const department = departmentName
    ? departmentName
        .split(" ")
        .map(word => word[0])
        .join("")
        .toUpperCase()
    : null;

  // SUBJECT
  text = text.replace(/\n\n/g, " ");
  const lines = text.split("\n");
  let subjectLine = "";
  let subjectStarted = false;

  for (let line of lines) {
    line = line.trim();
    if (subjectStarted) {
      // Stop if an empty line, another header, or a sentence-like line is encountered
      if (line === "" || /^[A-Z ]+ :/.test(line) || /^[A-Z]/.test(line)) {
        break;
      } else {
        subjectLine += " " + line;
      }
    } else if (line.startsWith("SUBJECT :")) {
      subjectStarted = true;
      subjectLine = line.replace("SUBJECT :", "").trim();
    }
  }

  const subject = subjectLine?.trim() || null;

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

  // Combine data of CTS
  const ctsNo = `${department}-${documentTypeAbreviation}-${splitDate}-0001`;

  const OCRData = [
    { data: `Date & Time: ${formattedDateTime}\n`, mode: "byte" },
    { data: `CTS No.: ${ctsNo}`, mode: "byte" },
    { data: `\nDepartment: ${department}`, mode: "byte" },
    { data: `\nDocument Type: ${documentType}`, mode: "byte" },
    { data: `\nSubject: ${subject}`, mode: "byte" },
  ];

  return OCRData;
};

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
    // /Effectivity\s+[A-Za-z]+\s+\d{1,2},\s+\d{4}\s+([^\s]+)/i
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

  // reference number form number-date-sequence number
  // get licensee from licensee / applicant section
  // get department from depart section
  // get form number from form number section and split by " "
  // get doc type from form number section

  return OCRData;
};
