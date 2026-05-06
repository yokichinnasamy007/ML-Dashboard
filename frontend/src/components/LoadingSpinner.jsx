export default function LoadingSpinner({ message = "Loading data..." }) {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
      <span>{message}</span>
    </div>
  );
}
