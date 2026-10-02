import { useLocation } from 'react-router';
import Button from '../components/ui/Button.jsx';
import { useSeo } from '../hooks/useSeo.js';
import './pages.css';

export default function NotFoundPage() {
  const { pathname } = useLocation();
  useSeo({
    title: 'Page not found',
    description: 'That page does not exist on BeatNest.',
    path: pathname,
    noindex: true,
  });

  return (
    <div className="page container not-found">
      <p className="not-found__code" aria-hidden="true">
        404
      </p>
      <h1>This track doesn&apos;t exist</h1>
      <p className="text-muted">
        We couldn&apos;t find <code>{pathname}</code>. It may have been moved, or the link may be mistyped.
      </p>
      <Button variant="primary" size="lg" to="/">
        Back to the player
      </Button>
    </div>
  );
}
