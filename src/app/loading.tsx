export default function Loading() {
  return (
    <div className="page bg-grad loading-screen">
      <div className="loading-state" role="status" aria-live="polite" aria-busy="true">
        <span className="spinner" aria-hidden="true"></span>
        <span>Loading page...</span>
      </div>
    </div>
  );
}
