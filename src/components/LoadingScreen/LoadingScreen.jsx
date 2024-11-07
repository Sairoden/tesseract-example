// REACT
import { useEffect, useState } from "react";

// STYLES
import "./LoadingScreen.css";

export default function LoadingScreen({ isLoading }) {
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Set startTime only once when isLoading becomes true
  useEffect(() => {
    if (isLoading) {
      setStartTime(Date.now());
      setElapsedTime(0); // Reset elapsed time
    }
  }, [isLoading]);

  useEffect(() => {
    let interval;

    if (isLoading && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      clearInterval(interval);
    }

    // Clear interval on unmount or when loading stops
    return () => clearInterval(interval);
  }, [isLoading, startTime]);

  // Format elapsed time for display
  const formatTime = seconds => {
    if (seconds < 60) return `${seconds} sec`;
    else if (seconds < 3600)
      return `${Math.floor(seconds / 60)} min ${seconds % 60} sec`;
    else
      return `${Math.floor(seconds / 3600)} hr ${Math.floor(
        (seconds % 3600) / 60
      )} min`;
  };

  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="spinner">
        <div className="double-bounce1"></div>
        <div className="double-bounce2"></div>
      </div>
      <div className="loading-text">
        Processing, please wait... ({formatTime(elapsedTime)})
      </div>
    </div>
  );
}
