import './ui.css';

/** tone: error | info | success */
export default function Alert({ tone = 'info', children, className = '', ...rest }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`alert alert--${tone} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}
