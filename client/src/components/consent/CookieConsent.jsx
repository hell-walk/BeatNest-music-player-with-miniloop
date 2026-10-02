import { Link } from 'react-router';
import { useConsent } from '../../context/ConsentContext.jsx';
import Button from '../ui/Button.jsx';

/**
 * Non-blocking consent banner. Both choices are equally prominent (no dark
 * patterns) and the decision can be revisited from "Cookie settings" in the footer.
 */
export default function CookieConsent() {
  const { isOpen, acceptAll, essentialOnly } = useConsent();
  if (!isOpen) return null;

  return (
    <section
      className="cookie-banner"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <div className="cookie-banner__text">
        <h2 id="cookie-banner-title">Cookies on BeatNest</h2>
        <p id="cookie-banner-desc">
          We set one essential cookie to keep you logged in. With your permission we also collect anonymous
          usage statistics to improve the player. <Link to="/privacy#cookies">Read our cookie policy</Link>.
        </p>
      </div>
      <div className="cookie-banner__actions">
        <Button variant="secondary" onClick={essentialOnly}>
          Essential only
        </Button>
        <Button variant="secondary" onClick={acceptAll}>
          Accept analytics
        </Button>
      </div>
    </section>
  );
}
