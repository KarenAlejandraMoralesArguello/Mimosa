import Logo from './Logo.jsx'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <Logo light />
          <p className="footer-tag">El club que conecta marcas con creadoras de contenido UGC, con pagos seguros en escrow.</p>
        </div>
        <div className="footer-cols">
          <div>
            <h4>Producto</h4>
            <a href="/#como-funciona">Cómo funciona</a>
            <a href="/#planes">Planes</a>
            <a href="/#para-creadoras">Para creadoras</a>
          </div>
          <div>
            <h4>Legal</h4>
            <a href="#">Términos y condiciones</a>
            <a href="#">Privacidad</a>
            <a href="#">Facturación CFDI</a>
          </div>
          <div>
            <h4>Soporte</h4>
            <a href="https://wa.me/520000000000" target="_blank" rel="noreferrer">WhatsApp corporativo</a>
            <a href="#">Centro de ayuda</a>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Mimosa Colab Club — Confidencial</span>
        <span>Hecho con la paleta oficial de la marca</span>
      </div>
    </footer>
  )
}
