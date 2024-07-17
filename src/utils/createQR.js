// LIBRARIES
import QRCodeStyling from "qr-code-styling";

export const createQR = ({ data, width, height, logo }) => {
  const QRCode = new QRCodeStyling(
    //   {
    //   width,
    //   height,
    //   data,
    //   margin: 0,
    //   qrOptions: {
    //     typeNumber: "0",
    //     mode: "Byte",
    //     errorCorrectionLevel: "Q",
    //   },
    //   imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 0 },
    //   dotsOptions: {
    //     type: "square",
    //     color: "#000000",
    //     gradient: {
    //       type: "linear",
    //       rotation: 0.9599310885968813,
    //       colorStops: [
    //         { offset: 0, color: "#023ed0" },
    //         { offset: 1, color: "#e00001" },
    //       ],
    //     },
    //   },
    //   backgroundOptions: { color: "#ffffff", gradient: null },
    //   image: logo,
    //   dotsOptionsHelper: {
    //     colorType: { single: true, gradient: false },
    //     gradient: {
    //       linear: true,
    //       radial: false,
    //       color1: "#000000",
    //       color2: "#000000",
    //       rotation: "0",
    //     },
    //   },
    //   cornersSquareOptions: { type: "", color: "#000000", gradient: null },
    //   cornersSquareOptionsHelper: {
    //     colorType: { single: true, gradient: false },
    //     gradient: {
    //       linear: true,
    //       radial: false,
    //       color1: "#000000",
    //       color2: "#000000",
    //       rotation: "0",
    //     },
    //   },
    //   cornersDotOptions: { type: "", color: "#000000", gradient: null },
    //   cornersDotOptionsHelper: {
    //     colorType: { single: true, gradient: false },
    //     gradient: {
    //       linear: true,
    //       radial: false,
    //       color1: "#000000",
    //       color2: "#000000",
    //       rotation: "0",
    //     },
    //   },
    //   backgroundOptionsHelper: {
    //     colorType: { single: true, gradient: false },
    //     gradient: {
    //       linear: true,
    //       radial: false,
    //       color1: "#ffffff",
    //       color2: "#ffffff",
    //       rotation: "0",
    //     },
    //   },
    // }

    {
      width,
      height,
      type: "canvas",
      data,
      image: logo,
      dotsOptions: {
        gradient: {
          type: "linear",
          rotation: 0,
          colorStops: [
            { offset: 0, color: "#0238bd" },
            { offset: 1, color: "#cc0001" },
          ],
        },
        type: "square",
      },
      backgroundOptions: {
        color: "#FFFFFF",
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 10,
      },
    }
  );

  return QRCode;
};
