import { Link } from 'react-router';
import './Button.css';

/**
 * One button component for the whole app.
 * variant: primary | secondary | ghost | icon | danger
 * Only ONE primary button should be visible per screen (single clear CTA).
 */
export default function Button({
  variant = 'secondary',
  size = 'md',
  to,
  href,
  className = '',
  loading = false,
  active = false,
  children,
  ...rest
}) {
  const cls = ['btn', `btn--${variant}`, `btn--${size}`, loading && 'is-loading', active && 'is-active', className]
    .filter(Boolean)
    .join(' ');

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  }
  const { disabled, type = 'button', ...buttonProps } = rest;
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...buttonProps}>
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
