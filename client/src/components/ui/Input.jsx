import { describedBy } from './FormField.jsx';

export default function Input({ id, error, hint, className = '', ...rest }) {
  return (
    <input id={id} className={`input ${className}`.trim()} {...describedBy(id, { error, hint })} {...rest} />
  );
}
