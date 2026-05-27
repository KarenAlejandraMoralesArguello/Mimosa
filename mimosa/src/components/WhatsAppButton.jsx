// PRD §8: botón flotante persistente de soporte por WhatsApp.
export default function WhatsAppButton() {
  return (
    <a
      className="wa-fab"
      href="https://wa.me/520000000000?text=Hola%20Mimosa%2C%20necesito%20ayuda"
      target="_blank"
      rel="noreferrer"
      aria-label="Soporte por WhatsApp"
      title="Soporte por WhatsApp"
    >
      <svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor" aria-hidden="true">
        <path d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.1 1.6 5.9L4 29l8.3-1.6c1.7.9 3.7 1.4 5.7 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-4.9 1 1-4.8-.3-.4A9.7 9.7 0 0 1 6.3 15C6.3 9.7 10.7 5.3 16 5.3S25.7 9.7 25.7 15 21.3 24.8 16 24.8zm5.5-7.3c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.6-.4z"/>
      </svg>
      <span>Soporte</span>
    </a>
  )
}
