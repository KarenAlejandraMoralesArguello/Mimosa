// Set de íconos SVG (reemplaza los emojis). Tamaño y color controlables.
// Uso: <Icon name="shield" size={18} />
const PATHS = {
  shield: 'M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z',
  check: 'M5 12l4 4L19 6',
  chat: 'M21 12a8 8 0 1 1-3.2-6.4L21 4l-1.4 3.4A8 8 0 0 1 21 12zM8 11h.01M12 11h.01M16 11h.01',
  scale: 'M12 3v18M5 7h14M7 7l-3 7a3 3 0 0 0 6 0l-3-7zm10 0-3 7a3 3 0 0 0 6 0l-3-7zM7 21h10',
  megaphone: 'M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zm13-5v12a3 3 0 0 0 0-12zm-5 12v3',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm13 10v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  home: 'M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2v-9z',
  shop: 'M3 6h18l-2 12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L3 6zm5 0a4 4 0 0 1 8 0',
  video: 'M3 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6zm14 4 4-2v8l-4-2',
  bank: 'M3 10 12 4l9 6H3zm2 2v7m4-7v7m6-7v7m4-7v7M3 21h18',
  money: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  user: 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  calendar: 'M3 8h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm3-3v6m8-6v6',
  building: 'M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M5 21h14M9 7h2M9 11h2M9 15h2m4-8h2m-2 4h2m-2 4h2',
  bulb: 'M9 18h6m-5 3h4M12 2a7 7 0 0 0-4 12.7c.7.6 1 1.5 1 2.3v1h6v-1c0-.8.3-1.7 1-2.3A7 7 0 0 0 12 2z',
  lock: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zm2 0V7a5 5 0 0 1 10 0v4',
  palette: 'M12 22a10 10 0 1 1 10-10c0 2-2 3-4 3h-2a2 2 0 0 0-2 2v1a3 3 0 0 1-3 3 1 1 0 0 1 1 1zm-5-9a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm4-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z',
  coin: 'M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0zm12-3h-3.5a1.5 1.5 0 0 0 0 3h3a1.5 1.5 0 0 1 0 3H10M12 7v1m0 8v1',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-14v6l3 2',
  paperclip: 'M21 11.5 12.5 20a5.5 5.5 0 0 1-7.8-7.8L13.6 3.3a3.7 3.7 0 0 1 5.2 5.2L9.9 17.4a1.8 1.8 0 0 1-2.6-2.6l7.8-7.8',
  link: 'M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07L11 5m3 6a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07L13 19',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5m5-5v12',
  hourglass: 'M6 2h12M6 22h12M7 2v4c0 3 5 3 5 6s-5 3-5 6v4m10-20v4c0 3-5 3-5 6s5 3 5 6v4',
  star: 'M12 2 15.1 9 22 9.3l-5.3 4.6L18.3 22 12 18l-6.3 4 1.6-8.1L2 9.3 8.9 9z',
  plus: 'M12 5v14M5 12h14',
  external: 'M14 3h7v7M21 3 10 14M5 7v12a2 2 0 0 0 2 2h12',
  card: 'M3 6h18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM3 10h18',
  rocket: 'M12 2c2 2 4 5 4 8a4 4 0 1 1-8 0c0-3 2-6 4-8zM6 16c-1.5 1.5-2 4-2 6 2 0 4.5-.5 6-2m6 0c1.5 1.5 4 2 6 2 0-2-.5-4.5-2-6',
}

const FILL = { star: true, shield: true }

export default function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 1.8, className }) {
  const d = PATHS[name]
  if (!d) return null
  const filled = FILL[name]
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={filled ? 0 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {d.split('M').filter(Boolean).map((seg, i) => (
        <path key={i} d={'M' + seg} />
      ))}
    </svg>
  )
}
