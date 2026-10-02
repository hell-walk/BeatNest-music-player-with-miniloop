import { PAGE_ROUTES } from '@beatnest/shared';
import { Link } from 'react-router';
import { useSeo } from '../hooks/useSeo.js';
import './pages.css';

const ROUTE = PAGE_ROUTES.find((r) => r.path === '/terms');
const LAST_UPDATED = '2 October 2026';
const CONTACT_EMAIL = 'hello@beatnest.example.com'; // TODO: replace before launch

export default function TermsPage() {
  useSeo({ title: ROUTE.title, description: ROUTE.description, path: '/terms' });

  return (
    <article className="page container prose">
      <h1>Terms &amp; Conditions</h1>
      <p className="updated">Last updated: {LAST_UPDATED}</p>

      <p>
        These terms apply when you use the BeatNest music player (&ldquo;the service&rdquo;). By using the
        service you agree to them. If you do not agree, please do not use the service.
      </p>

      <h2>1. The service</h2>
      <p>
        BeatNest lets you stream curated playlists and build a &ldquo;Mini Loop&rdquo; of songs. The service is
        provided free of charge, as-is, and may change or be withdrawn at any time without notice.
      </p>

      <h2>2. Accounts</h2>
      <ul>
        <li>You must be at least 13 years old to create an account.</li>
        <li>Keep your password confidential. You are responsible for activity under your account.</li>
        <li>Give us accurate information and keep it up to date.</li>
        <li>You may delete your account at any time by contacting us.</li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>download, copy, redistribute or commercially exploit any audio streamed through the service;</li>
        <li>attempt to bypass rate limits, security controls or access other users&rsquo; data;</li>
        <li>use bots or scripts to create accounts or submit forms;</li>
        <li>use the service in any way that breaks applicable law.</li>
      </ul>

      <h2>4. Music and copyright</h2>
      <p>
        All recordings remain the property of their respective artists and rights holders. Audio is made
        available for personal, non-commercial listening within the service only. If you are a rights holder
        and believe content is used without permission, email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with details and we will act promptly.
      </p>

      <h2>5. Privacy</h2>
      <p>
        How we handle your data is described in our <Link to="/privacy">Privacy Policy</Link>, which forms
        part of these terms.
      </p>

      <h2>6. Availability and liability</h2>
      <p>
        We do our best to keep the service running, but we do not guarantee it will be uninterrupted or
        error-free. To the fullest extent permitted by law, BeatNest is not liable for any indirect or
        consequential loss arising from your use of, or inability to use, the service. Nothing in these terms
        limits liability that cannot be limited by law.
      </p>

      <h2>7. Termination</h2>
      <p>
        We may suspend or close accounts that breach these terms. You may stop using the service at any time.
      </p>

      <h2>8. Changes to these terms</h2>
      <p>
        We may update these terms from time to time. The date at the top shows the latest version. Continued
        use after a change means you accept the updated terms.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about these terms? Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </article>
  );
}
