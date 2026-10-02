import { PAGE_ROUTES } from '@beatnest/shared';
import { Link } from 'react-router';
import { useConsent } from '../context/ConsentContext.jsx';
import { useSeo } from '../hooks/useSeo.js';
import './pages.css';

const ROUTE = PAGE_ROUTES.find((r) => r.path === '/privacy');
const LAST_UPDATED = '2 October 2026';
const CONTACT_EMAIL = 'privacy@beatnest.example.com'; // TODO: replace before launch

export default function PrivacyPage() {
  useSeo({ title: ROUTE.title, description: ROUTE.description, path: '/privacy' });
  const { reopen, consent } = useConsent();

  return (
    <article className="page container prose">
      <h1>Privacy Policy</h1>
      <p className="updated">Last updated: {LAST_UPDATED}</p>

      <p>
        BeatNest (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a free music player. This policy explains what
        information we collect when you use it, why, and the choices you have. We collect as little as we can:
        you can listen to every playlist without creating an account.
      </p>

      <h2 id="what-we-collect">What we collect</h2>
      <ul>
        <li>
          <strong>Account details</strong> (only if you sign up): your name, date of birth, gender, username,
          email address and a one-way hash of your password. We never store your password itself.
        </li>
        <li>
          <strong>Your Mini Loop</strong>: the songs you save so they can be restored on your next visit. For
          guests this is kept only in your browser&rsquo;s local storage.
        </li>
        <li>
          <strong>Session data</strong>: when you log in we store the time, expiry and browser user-agent of the
          session so you can stay logged in and we can detect abuse.
        </li>
        <li>
          <strong>Usage analytics</strong> (only with your consent): which pages are viewed and which player
          features are used, tied to a random id that lives in your browser for the current tab session only.
          We do not store IP addresses or link analytics to your account.
        </li>
        <li>
          <strong>Server logs</strong>: standard request logs (path, status code, timing) kept for security and
          debugging, retained for no more than 30 days.
        </li>
      </ul>

      <h2 id="how-we-use">How we use it</h2>
      <ul>
        <li>To provide the service: streaming audio, saving and restoring your Mini Loop, keeping you logged in.</li>
        <li>To keep the service secure: rate limiting, spam and bot protection, detecting abuse.</li>
        <li>To understand which features are useful (analytics, with consent) so we can improve the player.</li>
      </ul>
      <p>We do not sell personal data, show advertising or build marketing profiles.</p>

      <h2 id="cookies">Cookies and local storage</h2>
      <ul>
        <li>
          <strong>bn_session</strong> (cookie, essential): keeps you logged in. Set only when you log in;
          expires after 30 days or when you log out. HttpOnly, SameSite=Lax and Secure on HTTPS.
        </li>
        <li>
          <strong>bn_consent_v1</strong> (local storage): remembers your cookie choice so we don&rsquo;t ask again.
        </li>
        <li>
          <strong>bn_player_prefs_v1</strong> and <strong>bn_mini_loop_v1</strong> (local storage): your volume,
          shuffle and repeat settings and, for guests, your Mini Loop.
        </li>
        <li>
          <strong>bn_sid</strong> (session storage, analytics only): a random id that disappears when you close
          the tab.
        </li>
        <li>
          If the site is configured to use a third-party analytics provider (Plausible or Google Analytics),
          that provider may set its own cookies. They are only loaded after you accept analytics.
        </li>
      </ul>
      <p>
        You currently have analytics{' '}
        <strong>{consent ? (consent.analytics ? 'enabled' : 'disabled') : 'not yet chosen'}</strong>.{' '}
        <button type="button" className="link-button" onClick={reopen}>
          Change your cookie settings
        </button>
        .
      </p>

      <h2 id="retention">How long we keep data</h2>
      <ul>
        <li>Account data: until you delete your account.</li>
        <li>Sessions: 30 days after they were created, or immediately when you log out.</li>
        <li>Analytics events: 90 days, then deleted automatically.</li>
      </ul>

      <h2 id="rights">Your rights</h2>
      <p>
        You can ask us to access, correct, export or delete the personal data we hold about you at any time by
        emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. We will respond within 30 days.
        Depending on where you live you may also have the right to complain to a data-protection authority.
      </p>

      <h2 id="children">Children</h2>
      <p>
        BeatNest is not intended for children under 13 and we do not knowingly create accounts for them. If you
        believe a child has registered, contact us and we will remove the account.
      </p>

      <h2 id="security">Security</h2>
      <p>
        Passwords are hashed with scrypt, sessions are random 256-bit tokens stored only as hashes, all traffic
        is served over HTTPS in production and the API enforces rate limits and strict security headers. No
        system is perfectly secure, so please use a unique password.
      </p>

      <h2 id="changes">Changes</h2>
      <p>
        If we change this policy we will update the date at the top of this page. Significant changes will be
        announced inside the app. Also see our <Link to="/terms">Terms &amp; Conditions</Link>.
      </p>
    </article>
  );
}
