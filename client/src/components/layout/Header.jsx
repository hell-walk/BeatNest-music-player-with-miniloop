import { Link } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { LogoMark } from '../icons.jsx';
import Button from '../ui/Button.jsx';
import ThemeSwitcher from './ThemeSwitcher.jsx';

export default function Header() {
  const { user, status, logout } = useAuth();

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="brand" aria-label="BeatNest – home">
          <LogoMark size={32} />
          <span className="brand__name">BeatNest</span>
        </Link>

        <nav className="site-nav" aria-label="Primary">
          <ThemeSwitcher />

          {status === 'authed' ? (
            <>
              <span className="site-nav__user">Hi, {user.username}</span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" to="/login">
                Log in
              </Button>
              <Button variant="secondary" size="sm" to="/signup">
                Sign up
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
