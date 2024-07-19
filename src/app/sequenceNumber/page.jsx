"use client";

import { useState, useEffect } from "react";

const FileUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    // Load files from local storage on component mount
    const storedFiles = JSON.parse(localStorage.getItem("uploadedFiles")) || [];
    const transformedFiles = transformData(storedFiles);
    setUploadedFiles(transformedFiles);
    // console.log("Loaded files from storage:", storedFiles);
    // setUploadedFiles(storedFiles);
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const newFilename = await getUniqueFilename(file.name);
      const renamedFile = new File([file], newFilename, { type: file.type });

      // Convert file to base64 string for storage
      const fileData = await convertToBase64(renamedFile);

      // Save the renamed file in local storage
      const newFileEntry = { name: newFilename, data: fileData };
      const updatedFiles = [...uploadedFiles, newFileEntry];
      console.log("Updated files to be saved:", updatedFiles);
      localStorage.setItem("uploadedFiles", JSON.stringify(updatedFiles));
      setUploadedFiles(updatedFiles);
    }
  };

  const getUniqueFilename = async (originalFilename) => {
    // Define department, docType, and formattedDate as needed
    const department = "Dept";
    const docType = "Doc";
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const year = now.getFullYear();

    const formattedDate = `${month}${day}${year}`; // Example date format

    let sequenceNo = 1;
    let fileName = `${department}-${docType}-${formattedDate}-${sequenceNo
      .toString()
      .padStart(4, "0")}`;

    const storedFiles = JSON.parse(localStorage.getItem("uploadedFiles")) || [];
    const existingFileNames = storedFiles.map((file) => file.name);

    while (existingFileNames.includes(`${fileName}.pdf`)) {
      sequenceNo++;
      fileName = `${department}-${docType}-${formattedDate}-${sequenceNo
        .toString()
        .padStart(4, "0")}`;
    }

    const extension = originalFilename.substring(
      originalFilename.lastIndexOf(".")
    );
    return `${fileName}${extension}`;
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleClear = () => {
    localStorage.removeItem("uploadedFiles");
    setUploadedFiles([]);
  };

  const transformData = (data) => {
    return data.map((item) => {
      const name =
        typeof item.name === "string" ? item.name : "UnnamedFile.pdf";
      return {
        name: name,
        data: item.data,
      };
    });
  };

  return (
    <div>
      <input type="file" onChange={handleFileUpload} />
      <button onClick={handleClear}>Clear</button>
      <div>
        <h3>Uploaded Files:</h3>
        {uploadedFiles.length > 0 ? (
          uploadedFiles.map((file, index) => (
            <li key={index}>
              <a href={file.data} download={file.name}>
                {file.name}
              </a>
            </li>
          ))
        ) : (
          <p>No files available</p>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
