export function LoadingSpinner() {
  return (
    <div className="loading-container" role="status" aria-live="polite" aria-label="Loading recipe">
      <div className="spinner" aria-hidden="true"></div>
      <p className="loading-text">Generating your recipe...</p>
    </div>
  );
}
