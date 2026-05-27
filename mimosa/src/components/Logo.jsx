export default function Logo({ light = false }) {
  return (
    <span className={`logo${light ? ' logo-light' : ''}`}>
      <span className="logo-mark">M</span>
      <span className="logo-text">
        <span className="logo-main">Mimosa</span>
        <span className="logo-sub">COLAB CLUB</span>
      </span>
    </span>
  )
}
