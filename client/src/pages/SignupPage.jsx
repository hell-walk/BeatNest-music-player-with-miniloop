import { PAGE_ROUTES, signupSchema } from '@beatnest/shared';
import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { LogoMark } from '../components/icons.jsx';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import FormField from '../components/ui/FormField.jsx';
import Input from '../components/ui/Input.jsx';
import Select from '../components/ui/Select.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useForm } from '../hooks/useForm.js';
import { useFormToken } from '../hooks/useFormToken.js';
import { useSeo } from '../hooks/useSeo.js';
import './pages.css';

const ROUTE = PAGE_ROUTES.find((r) => r.path === '/signup');

/** Latest date of birth that still makes someone 13 today (YYYY-MM-DD). */
function maxDateOfBirth() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 13);
  return d.toISOString().slice(0, 10);
}

export default function SignupPage() {
  useSeo({ title: ROUTE.title, description: ROUTE.description, path: '/signup' });

  const { signup, isAuthed } = useAuth();
  const navigate = useNavigate();
  const { formToken, tokenError, refreshFormToken } = useFormToken();
  const formRef = useRef(null);

  const form = useForm({
    formRef,
    initialValues: {
      fullName: '',
      dateOfBirth: '',
      gender: '',
      username: '',
      email: '',
      password: '',
      acceptTerms: false,
      website: '',
    },
    schema: signupSchema,
    onSubmit: async (data) => {
      const token = formToken ?? (await refreshFormToken());
      await signup({ ...data, formToken: token ?? undefined });
      navigate('/', { replace: true });
    },
  });

  useEffect(() => {
    if (isAuthed && !form.submitting) navigate('/', { replace: true });
  }, [isAuthed, form.submitting, navigate]);

  const field = (name) => ({
    name,
    value: form.values[name],
    onChange: form.handleChange,
    onBlur: form.handleBlur,
    error: form.errors[name],
  });

  return (
    <div className="page container auth-page">
      <div className="auth-card">
        <LogoMark size={48} className="auth-card__logo" />
        <h1>Create your account</h1>
        <p className="text-muted">Free forever. Your Mini Loop follows you to any device.</p>

        <form ref={formRef} onSubmit={form.handleSubmit} noValidate>
          {form.formError && <Alert tone="error">{form.formError}</Alert>}

          <FormField id="fullName" label="Full name" error={form.errors.fullName} required>
            <Input id="fullName" autoComplete="name" required {...field('fullName')} />
          </FormField>

          <FormField
            id="dateOfBirth"
            label="Date of birth"
            error={form.errors.dateOfBirth}
            hint="You need to be 13 or older."
            required
          >
            <Input
              id="dateOfBirth"
              type="date"
              autoComplete="bday"
              max={maxDateOfBirth()}
              required
              hint="You need to be 13 or older."
              {...field('dateOfBirth')}
            />
          </FormField>

          <FormField id="gender" label="Gender" error={form.errors.gender} required>
            <Select id="gender" required {...field('gender')}>
              <option value="" disabled>
                Select an option
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not">Prefer not to say</option>
            </Select>
          </FormField>

          <FormField
            id="username"
            label="Username"
            error={form.errors.username}
            hint="3–20 letters, numbers or underscores."
            required
          >
            <Input
              id="username"
              autoComplete="username"
              autoCapitalize="off"
              spellCheck={false}
              required
              hint="3–20 letters, numbers or underscores."
              {...field('username')}
            />
          </FormField>

          <FormField id="email" label="Email" error={form.errors.email} required>
            <Input id="email" type="email" autoComplete="email" inputMode="email" required {...field('email')} />
          </FormField>

          <FormField
            id="password"
            label="Password"
            error={form.errors.password}
            hint="At least 8 characters with a letter and a number."
            required
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              hint="At least 8 characters with a letter and a number."
              {...field('password')}
            />
          </FormField>

          <div className="field">
            <label className="checkbox">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={form.values.acceptTerms}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                aria-invalid={form.errors.acceptTerms ? true : undefined}
                aria-describedby={form.errors.acceptTerms ? 'acceptTerms-error' : undefined}
                required
              />
              <span>
                I agree to the <Link to="/terms">Terms &amp; Conditions</Link> and the{' '}
                <Link to="/privacy">Privacy Policy</Link>.
              </span>
            </label>
            {form.errors.acceptTerms && (
              <p id="acceptTerms-error" className="field__error" role="alert">
                {form.errors.acceptTerms}
              </p>
            )}
          </div>

          <div className="hp-field" aria-hidden="true">
            <label htmlFor="signup-website">Website</label>
            <input
              id="signup-website"
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
            Create account
          </Button>

          <p className="auth-card__alt">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
