"use client";

import { useState } from "react";
import QRCode from "qrcode";
import styled from "styled-components";
import Image from "next/image";

export default function QRGenerator() {
  // const [url, setUrl] = useState("");
  const [dataUrl, setDataUrl] = useState("");

  const handleQRCodeGeneration = () => {
    QRCode.toDataURL("https://google.com", (err, dataUrl) => {
      if (err) {
        console.error(err);
      } else {
        setDataUrl(dataUrl);
      }
    });
  };
  console.log(dataUrl);
  return (
    <StyledContainer>
      <div className="app">
        <button onClick={handleQRCodeGeneration}>Generate QR</button>

        {dataUrl && (
          <div className="generated-view">
            {/* <img src={dataUrl} width={300} height={300} alt="qr code" /> */}

            <Image src={dataUrl} width={300} height={300} alt="qr code" />
          </div>
        )}
      </div>
    </StyledContainer>
  );
}
// const [url, setUrl] = useState("");
// const [dataUrl, setDataUrl] = useState("");

// const site = "https://google.com";
// setUrl(site);
// const handleQRCodeGeneration = () => {
//   // e.preventDefault();
//   QRCode.toDataURL(url, { width: 300 }, (err, dataUrl) => {
//     if (err) console.error(err);
//     // set dataUrl state to dataUrl
//     setDataUrl(dataUrl);
//   });
// };

// return (
//   <StyledContainer>
//     <div className="app">
//       <h1>QR Code Generator</h1>
{
  /* <form onSubmit={handleQRCodeGeneration}>
          <input
            required
            type="url"
            placeholder="Enter a valid URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <input type="submit" value="Generate" />
        </form> */
}

{
  /* <input type="file" onChange={handleQRCodeGeneration} accept="application/pdf" /> */
}
//         <button onClick={handleQRCodeGeneration}>Generate QR</button>

//         {dataUrl && (
//           <div className="generated-view">
//             <Image src={dataUrl} width={300} height={300} alt="qr code" />
//             {/* https://google.com */}
//             {/* <a href={dataUrl}>Download</a> */}
//           </div>
//         )}
//       </div>
//     </StyledContainer>
//   );
// }

const StyledContainer = styled.div`
  .app {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    min-height: 100vh;
    margin: 0;

    background: #121212;
    color: #fff;

    form {
      // border: 1px solid red;
      width: 50%;
      margin: 0 auto;
      padding: 1rem;

      input {
        display: block;
        width: 80%;
        margin: 0 auto;
        padding: 1rem 1.5rem;
        margin-bottom: 1rem;

        &:focus {
          outline: none;
        }

        &[type="url"] {
          font-size: 1.2rem;
          text-align: center;
        }
        &[type="submit"] {
          cursor: pointer;
          background: rgb(62, 62, 169);
          color: #fff;
          outline: none;
          border: none;
          font-weight: bold;

          &:hover {
            background: rgba(62, 62, 169, 0.8);
          }
        }
      }
    }

    button {
      cursor: pointer;
      background: rgb(62, 62, 169);
      color: #fff;
      outline: none;
      border: none;
      font-weight: bold;
      padding: 1rem 11rem;

      &:hover {
        background: rgba(62, 62, 169, 0.8);
      }
    }

    .generated-view {
      display: flex;
      flex-direction: column;
      align-items: center;

      a {
        margin-top: 2rem;
        text-decoration: none;
        color: #fff;
        background: rgb(62, 62, 169);
        padding: 1rem 4rem;
        font-weight: bold;
        border-radius: 8px;
      }
    }
  }
`;
