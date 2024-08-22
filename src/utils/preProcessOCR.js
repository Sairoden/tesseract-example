// LIBRARIES
import cv from "@techstark/opencv-js";

export const preProcessOCR = canvasRef => {
  if (!canvasRef) return;

  const canvas = canvasRef.current;

  let src = cv.imread(canvas);
  let dst = new cv.Mat();

  let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(1, 1));
  cv.resize(src, dst, dst.size(), 2, 2, cv.INTER_LINEAR);
  cv.dilate(src, dst, kernel, new cv.Point(-1, -1));

  // cv.GaussianBlur(src, dst, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
  cv.cvtColor(src, dst, cv.COLOR_BGR2GRAY, 0);

  // cv.threshold(src, dst, 50, 100, cv.THRESH_BINARY);

  let low = new cv.Mat(src.rows, src.cols, src.type(), [0, 0, 0, 0]);
  let high = new cv.Mat(src.rows, src.cols, src.type(), [150, 150, 150, 255]);

  cv.inRange(src, low, high, dst);

  cv.imshow(canvasRef.current, dst);

  const binarizedDataUrl = canvasRef.current.toDataURL();

  src.delete();
  dst.delete();
  low.delete();
  high.delete();

  return binarizedDataUrl;
};
