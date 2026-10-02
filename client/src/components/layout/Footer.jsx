import { Link } from 'react-router';
import { useConsent } from '../../context/ConsentContext.jsx';

const REPO_URL = 'https://github.com/hell-walk/BeatNest-music-player-with-miniloop';

export default function Footer() {
  const { reopen } = useConsent();

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <p className="site-footer__copy">
          © {new Date().getFullYear()} BeatNest. Audio is streamed for personal, non-commercial listening.
        </p>
        <nav className="site-footer__nav" aria-label="Legal">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms &amp; Conditions</Link>
          <button type="button" className="link-button" onClick={reopen}>
            Cookie settings
          </button>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            Source code<span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        </nav>
      </div>
    </footer>
  );
}
