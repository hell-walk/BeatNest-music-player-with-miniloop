import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

/**
 * Fetches the anti-spam form token when a public form mounts.
 * The server measures how long the form took to fill in from this token.
 */
export function useFormToken() {
  const [state, setState] = useState({ formToken: null, tokenError: null });

  const refreshFormToken = useCallback(async () => {
    try {
      const data = await api.getFormToken();
      setState({ formToken: data.formToken, tokenError: null });
      return data.formToken;
    } catch (err) {
      setState({ formToken: null, tokenError: err });
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .getFormToken()
      .then((data) => {
        if (!cancelled) setState({ formToken: data.formToken, tokenError: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ formToken: null, tokenError: err });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...state, refreshFormToken };
}
