// REACT
import { useState } from "react";

export default function SupportingDocs() {
  const [inputFiles, setInputFiles] = useState([]);

  const handleFilesChange = e => {
    const files = e.target.files;
    setInputFiles(files);

    console.log(files);
  };

  return (
    <div className="flex items-center space-x-4">
      <h1 className="text-4xl text-blue-400">Supporting Docs</h1>
      <input
        type="file"
        className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        accept="application/pdf"
        onChange={handleFilesChange}
      />

      <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
        Submit
      </button>
    </div>
  );
}
