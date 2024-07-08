export const convertOCR = (text) => {
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
  const sequenceNumber = "0001";

  // Combine data of CTS
  const ctsNo = `${formNo}-${splitDate}-${sequenceNumber}`;

  // Data of Department
  const department = formNo?.split("-")[0] || null;

  const OCRData = [
    { data: `Date and Time: ${formattedDateTime}\n`, mode: "byte" },
    { data: `CTS No.: ${ctsNo}`, mode: "byte" },
    { data: `\nLicensee: ${licensee}`, mode: "byte" },
    { data: `\nDepartment: ${department}`, mode: "byte" },
    { data: `\nDocument Type: ${docType}`, mode: "byte" },
  ];

  return OCRData;
};
