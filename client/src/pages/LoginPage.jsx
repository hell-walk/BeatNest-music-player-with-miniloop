import { loginSchema, PAGE_ROUTES } from '@beatnest/shared';
import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { LogoMark } from '../components/icons.jsx';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import FormField from '../components/ui/FormField.jsx';
import Input from '../components/ui/Input.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useForm } from '../hooks/useForm.js';
import { useFormToken } from '../hooks/useFormToken.js';
import { useSeo } from '../hooks/useSeo.js';
import './pages.css';

const ROUTE = PAGE_ROUTES.find((r) => r.path === '/login');

export default function LoginPage() {
  useSeo({ title: ROUTE.title, description: ROUTE.description, path: '/login' });

  const { login, isAuthed } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? '/';
  const { formToken, tokenError, refreshFormToken } = useFormToken();
  const formRef = useRef(null);

  const form = useForm({
    formRef,
    initialValues: { identifier: '', password: '', website: '' },
    schema: loginSchema,
    onSubmit: async (data) => {
      const token = formToken ?? (await refreshFormToken());
      await login({ ...data, formToken: token ?? undefined });
      navigate(from, { replace: true });
    },
  });

  // Already logged in? No need to show the form.
  useEffect(() => {
    if (isAuthed) navigate(from, { replace: true });
  }, [isAuthed, from, navigate]);

  return (
    <div className="page container auth-page">
      <div className="auth-card">
        <LogoMark size={48} className="auth-card__logo" />
        <h1>Welcome back</h1>
        <p className="text-muted">Log in to pick up your saved Mini Loop.</p>

        <form ref={formRef} onSubmit={form.handleSubmit} noValidate>
          {form.formError && <Alert tone="error">{form.formError}</Alert>}

          <FormField id="identifier" label="Username or email" error={form.errors.identifier} required>
            <Input
              id="identifier"
              name="identifier"
              autoComplete="username"
              autoFocus
              required
              value={form.values.identifier}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.errors.identifier}
            />
          </FormField>

          <FormField id="password" label="Password" error={form.errors.password} required>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.values.password}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.errors.password}
            />
          </FormField>

          {/* honeypot – invisible to people, tempting to bots */}
          <div className="hp-field" aria-hidden="true">
            <label htmlFor="login-website">Website</label>
            <input
              id="login-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={form.values.website}
              onChange={form.handleChange}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="auth-card__submit"
            loading={form.submitting}
            disabled={!formToken && !tokenError}
          >
            Log in
          </Button>

          <p className="auth-card__alt">
            New here? <Link to="/signup">Create a free account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
