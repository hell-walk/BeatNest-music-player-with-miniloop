import { describedBy } from './FormField.jsx';

export default function Select({ id, error, hint, className = '', children, ...rest }) {
  return (
    <select id={id} className={`input select ${className}`.trim()} {...describedBy(id, { error, hint })} {...rest}>
      {children}
    </select>
  );
}
