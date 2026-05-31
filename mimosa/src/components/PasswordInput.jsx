import { useState } from 'react'

// Ojo abierto
const EyeOpen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

// Ojo tachado
const EyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

/**
 * Campo de contraseña con botón para mostrar/ocultar.
 * Acepta las mismas props que <input> (value, onChange, placeholder, autoComplete, id, required…)
 */
export default function PasswordInput({ id, value, onChange, placeholder, autoComplete, required, disabled }) {
  const [show, setShow] = useState(false)

  return (
    <div className="pw-wrap">
      <input
        id={id}
        className="input"
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
      />
      <button
        type="button"
        className="pw-eye"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        tabIndex={-1}
      >
        {show ? <EyeOpen /> : <EyeOff />}
      </button>
    </div>
  )
}
