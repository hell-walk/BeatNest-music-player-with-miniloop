import Spinner from './Spinner.jsx';

/** Suspense fallback for lazily loaded routes. */
export default function PageLoader() {
  return (
    <div className="page-loader" aria-busy="true">
      <Spinner size={32} label="Loading page" />
    </div>
  );
}
