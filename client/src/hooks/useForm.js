import { validate } from '@beatnest/shared';
import { useCallback, useState } from 'react';
import { ApiError } from '../lib/api.js';

/**
 * Small form controller backed by a shared zod schema.
 *  - validates a field on blur (and live once it has been touched)
 *  - validates the whole form on submit and focuses the first invalid field
 *  - maps API 400/409 `errors` back onto fields
 * Pass the <form> ref in (`formRef`) so the first invalid field can be focused.
 */
export function useForm({ initialValues, schema, onSubmit, formRef }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const validateField = useCallback(
    (name, value) => {
      const fieldSchema = schema.shape?.[name];
      if (!fieldSchema) return null;
      const result = fieldSchema.safeParse(value);
      return result.success ? null : (result.error.issues[0]?.message ?? 'Invalid value');
    },
    [schema],
  );

  const setFieldValue = useCallback(
    (name, value) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      setFormError(null);
      if (touched[name]) {
        setErrors((prev) => ({ ...prev, [name]: validateField(name, value) ?? undefined }));
      }
    },
    [touched, validateField],
  );

  const handleChange = useCallback(
    (event) => {
      const { name, type, value, checked } = event.target;
      setFieldValue(name, type === 'checkbox' ? checked : value);
    },
    [setFieldValue],
  );

  const handleBlur = useCallback(
    (event) => {
      const { name, type, value, checked } = event.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name, type === 'checkbox' ? checked : value);
      setErrors((prev) => ({ ...prev, [name]: error ?? undefined }));
    },
    [validateField],
  );

  const focusFirstError = useCallback((fieldErrors) => {
    const first = Object.keys(fieldErrors).find((k) => k !== '_form');
    if (!first || !formRef.current) return;
    const el = formRef.current.querySelector(`[name="${first}"]`);
    el?.focus();
  }, [formRef]);

  const handleSubmit = useCallback(
    async (event) => {
      event?.preventDefault?.();
      setFormError(null);

      const result = validate(schema, values);
      if (!result.success) {
        setErrors(result.errors);
        setTouched(Object.fromEntries(Object.keys(values).map((k) => [k, true])));
        focusFirstError(result.errors);
        return;
      }

      setSubmitting(true);
      try {
        await onSubmit(result.data);
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.errors && Object.keys(err.errors).length) {
            setErrors(err.errors);
            if (err.errors._form) setFormError(err.errors._form);
            focusFirstError(err.errors);
          } else {
            setFormError(err.message);
          }
        } else {
          setFormError('Something went wrong. Please try again.');
        }
      } finally {
        setSubmitting(false);
      }
    },
    [schema, values, onSubmit, focusFirstError],
  );

  return {
    values,
    errors,
    touched,
    submitting,
    formError,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setErrors,
    setFormError,
  };
}
