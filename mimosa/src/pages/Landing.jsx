import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { PLANS } from '../data/mock.js'

const STEPS = [
  { n: '01', title: 'Publica tu campaña', text: 'La marca define duración, estilo (UGC, unboxing, reseña, acting) y requerimientos. Admin la pre-aprueba.', grad: 'var(--grad-rosa-violeta)' },
  { n: '02', title: 'Recibe postulaciones', text: 'Creadoras verificadas aplican con su propuesta creativa y costo por video (mínimo $500 MXN).', grad: 'var(--grad-solar-rosa)' },
  { n: '03', title: 'Negocia en el chat', text: 'Chat privado en tiempo real protegido con RLS. Comparte referencias ligeras hasta 5MB.', grad: 'var(--grad-violeta-azul)' },
  { n: '04', title: 'Paga en escrow', text: 'El capital se congela seguro en Stripe. Se libera solo cuando el contenido se aprueba.', grad: 'var(--grad-verde-azul)' },
]

const FEATURES = [
  { icon: '🛡️', title: 'Pagos blindados en escrow', text: 'El dinero queda en garantía en Stripe hasta que apruebas el contenido. Cero informalidad.' },
  { icon: '✅', title: 'Perfiles validados a mano', text: 'Cada creadora pasa por auditoría humana de portafolio antes de entrar al marketplace.' },
  { icon: '💬', title: 'Negociación en un solo lugar', text: 'Chat, propuestas, órdenes y entregables viven dentro de la plataforma. Sin caos en DMs.' },
  { icon: '⚖️', title: 'Arbitraje y control de calidad', text: 'Hasta 2 rondas de correcciones y panel de arbitraje para resolver disputas con justicia.' },
]

export default function Landing() {
  return (
    <div className="landing">
      <Navbar />

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="badge badge-rosa"><span className="dot" /> Marketplace UGC · México</span>
            <h1>Donde las marcas y las creadoras de contenido hacen <span className="hero-grad">match</span>.</h1>
            <p className="hero-lead">
              Mimosa Colab Club conecta marcas con creadoras de contenido UGC y blinda cada
              colaboración con pagos en garantía, perfiles verificados y entregas controladas.
            </p>
            <div className="hero-cta">
              <Link to="/registro?rol=marca" className="btn btn-grad">Soy marca · Quiero reclutar</Link>
              <Link to="/registro?rol=creadora" className="btn btn-ghost">Soy creadora · Quiero aplicar</Link>
            </div>
            <div className="hero-stats">
              <div><strong>20%</strong><span>Take rate transparente</span></div>
              <div><strong>$500</strong><span>Valor mínimo por video</span></div>
              <div><strong>100%</strong><span>Pagos en escrow Stripe</span></div>
            </div>
          </div>
          <div className="hero-art">
            <div className="float-card fc-1">
              <span className="badge badge-verde"><span className="dot" /> Match confirmado</span>
              <strong>Valentina Ríos</strong>
              <span className="text-muted">@valeugc · 4.9 ★</span>
            </div>
            <div className="float-card fc-2">
              <span className="badge badge-azul"><span className="dot" /> Escrow activo</span>
              <strong>$1,725 MXN</strong>
              <span className="text-muted">3 videos · Glow serum</span>
            </div>
            <div className="float-card fc-3">
              <span className="badge badge-naranja"><span className="dot" /> Entrega en 18h</span>
              <strong>UGC acting · Pulse</strong>
              <span className="text-muted">4 videos de 20s</span>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="section">
        <div className="container">
          <div className="center sec-head">
            <span className="eyebrow">Cómo funciona</span>
            <h2>De la idea al contenido, sin fricción</h2>
            <p className="text-muted">Un flujo blindado en cuatro pasos para que cobrar y entregar sea seguro para todos.</p>
          </div>
          <div className="grid steps-grid">
            {STEPS.map((s) => (
              <div key={s.n} className="step-card">
                <span className="step-n" style={{ background: s.grad }}>{s.n}</span>
                <h3>{s.title}</h3>
                <p className="text-muted">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section section-alt">
        <div className="container">
          <div className="center sec-head">
            <span className="eyebrow">Por qué Mimosa</span>
            <h2>Infraestructura que protege tu colaboración</h2>
          </div>
          <div className="grid features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="card card-pad feature-card">
                <span className="feature-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p className="text-muted">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" className="section">
        <div className="container">
          <div className="center sec-head">
            <span className="eyebrow">Planes para marcas</span>
            <h2>Suscripción mensual, sin sorpresas</h2>
            <p className="text-muted">Elige el plan según cuántas campañas activas necesitas al mes. Las creadoras nunca pagan suscripción.</p>
          </div>
          <div className="grid plans-grid">
            {PLANS.map((p) => (
              <div key={p.id} className={`plan-card${p.featured ? ' is-featured' : ''}`}>
                {p.featured && <span className="plan-tag">Más popular</span>}
                <div className="plan-bar" style={{ background: p.grad }} />
                <h3>{p.name}</h3>
                <div className="plan-price"><span>$</span>{p.price}<small>MXN/mes</small></div>
                <p className="plan-limit">{p.limit}</p>
                <ul className="plan-perks">
                  {p.perks.map((perk) => <li key={perk}>{perk}</li>)}
                </ul>
                <Link to="/registro?rol=marca" className={`btn ${p.featured ? 'btn-grad' : 'btn-ghost'} btn-block`}>Empezar prueba</Link>
              </div>
            ))}
          </div>
          <p className="center text-muted plans-note">
            Comisión del 20%: 15% lo añade la marca en checkout, 5% se retiene a la creadora. Facturación CFDI por membresías.
          </p>
        </div>
      </section>

      {/* PARA CREADORAS */}
      <section id="para-creadoras" className="section creators-cta">
        <div className="container creators-inner">
          <div className="creators-copy">
            <span className="eyebrow" style={{ color: '#fff' }}>Para creadoras</span>
            <h2 style={{ color: '#fff' }}>Tu talento, valorado y pagado a tiempo</h2>
            <p>
              Aplica a campañas de marcas reales, propone tu precio (desde $500 MXN por video) y
              cobra directo a tu CLABE vía Stripe Connect. Sin perseguir pagos.
            </p>
            <Link to="/registro?rol=creadora" className="btn btn-light">Crear mi perfil de creadora</Link>
          </div>
          <ul className="creators-points">
            <li><span>🎨</span> Validación de portafolio con feedback constructivo</li>
            <li><span>💸</span> Dispersión automática a tu cuenta bancaria</li>
            <li><span>🔒</span> Datos bancarios encriptados y protegidos con RLS</li>
            <li><span>⏱️</span> Reglas claras: máximo 2 rondas de correcciones</li>
          </ul>
        </div>
      </section>

      <Footer />
    </div>
  )
}
