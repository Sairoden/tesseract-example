"use client";

import { useEffect, useRef, useState } from "react";

function PdfViewer({ url, adobePreview }) {
  const viewerRef = useRef(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // const previewConfig = {
  //   embedMode: "SIZED_CONTAINER",
  //   // showDownloadPDF: false,
  //   // showZoomControl: false,
  // };

  // useEffect(() => {
  //   const initializeAdobeDCView = () => {
  //     if (window.AdobeDC && window.AdobeDC.View) {
  //       const adobeDCView = new window.AdobeDC.View({
  //         clientId: "45a8e546c01a4b0d901c8c9eecf1aefa",
  //         divId: viewerRef.current.id,
  //       });

  //       adobeDCView.previewFile(
  //         {
  //           content: { location: { url } },
  //           metaData: { fileName: "sample.pdf" },
  //         },
  //         {
  //           embedMode: "SIZED_CONTAINER",
  //         }
  //       );
  //     }
  //   };

  //   adobePreview.then(initializeAdobeDCView).catch(error => {
  //     console.error("Failed to load Adobe PDF Embed API script:", error);
  //   });
  // }, [adobePreview, url]);

  useEffect(() => {
    const loadAdobeScript = () => {
      return new Promise((resolve, reject) => {
        if (document.getElementById("adobe-dc-view-sdk")) {
          // If the script is already loaded, resolve immediately
          resolve();
        } else {
          const script = document.createElement("script");
          script.src = "https://documentcloud.adobe.com/view-sdk/main.js";
          script.id = "adobe-dc-view-sdk";
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        }
      });
    };

    const initializeAdobeDCView = () => {
      if (window.AdobeDC && window.AdobeDC.View) {
        const adobeDCView = new window.AdobeDC.View({
          // clientId: "45a8e546c01a4b0d901c8c9eecf1aefa",
          clientId: "67a96ca5dce34d0089b3b557564f1de6",
          divId: viewerRef.current.id,
        });

        adobeDCView.previewFile(
          {
            content: {
              location: {
                url: "https://acrobatservices.adobe.com/view-sdk-demo/PDFs/Bodea%20Brochure.pdf",
              },
            },
            metaData: { fileName: "sample.pdf" },
          },
          { embedMode: "SIZED_CONTAINER" }
        );
      }
    };

    loadAdobeScript()
      .then(() => {
        setIsScriptLoaded(true);
        initializeAdobeDCView();
      })
      .catch(error => {
        console.error("Failed to load Adobe PDF Embed API script:", error);
      });
  }, [url]);

  return (
    <div
      id="adobe-dc-view"
      ref={viewerRef}
      style={{ height: "476px", width: "600px", border: "1px solid #dadada" }}
    />
  );
}

export default PdfViewer;
