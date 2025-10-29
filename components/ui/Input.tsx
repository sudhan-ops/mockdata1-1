import React from 'react';
// Fix: Changed `import type` to inline `import { type ... }` for UseFormRegisterReturn to fix namespace-as-type error.
import { type UseFormRegisterReturn } from 'react-hook-form';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  registration?: UseFormRegisterReturn;
  icon?: 'mail' | 'lock'; // Add icon prop
}

const Input: React.FC<InputProps> = ({ label, id, error, registration, icon, ...props }) => {
  const { className, ...otherProps } = props;
  
  const baseClass = 'form-input';
  const errorClass = 'form-input--error';
  const finalClassName = `${baseClass} ${error ? errorClass : ''} ${className || ''}`;
  
  const inputElement = (
    <input
      id={id}
      className={`pl-10 ${finalClassName}`} // Add padding for icon
      aria-invalid={!!error}
      {...registration}
      {...otherProps}
    />
  );

  const renderIcon = () => {
    if (!icon) return null;
    const iconClass = "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400";
    switch (icon) {
      case 'mail':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        );
      case 'lock':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-muted">
          {label}
        </label>
      )}
      <div className={label ? "mt-1 relative" : "relative"}> {/* Add relative positioning for icon */}
        {renderIcon()}
        {inputElement}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default Input;