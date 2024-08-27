// STYLES
import "./LoadingScreen.css";

export default function LoadingScreen({ isLoading }) {
  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="spinner">
        <div className="double-bounce1"></div>
        <div className="double-bounce2"></div>
      </div>
      <div className="loading-text">Processing, please wait...</div>
    </div>
  );
}
