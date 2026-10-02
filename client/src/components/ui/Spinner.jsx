import './ui.css';

export default function Spinner({ size = 24, label = 'Loading' }) {
  return (
    <span className="spinner" style={{ width: size, height: size }} role="status" aria-live="polite">
      <span className="visually-hidden">{label}…</span>
    </span>
  );
}
