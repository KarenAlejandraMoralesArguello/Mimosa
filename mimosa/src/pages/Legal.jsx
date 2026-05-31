import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

// Páginas legales del MVP. Contenido informativo basado en el PRD;
// la versión definitiva debe ser revisada por asesoría legal antes de producción.

export function Terms() {
  return (
    <div>
      <Navbar />
      <main className="legal">
        <div className="container legal-inner">
          <span className="eyebrow">Documentación legal</span>
          <h1>Términos y Condiciones</h1>
          <p className="text-muted">Última actualización: 28 de mayo de 2026 · MVP v1.0</p>

          <section>
            <h2>1. Naturaleza del servicio</h2>
            <p>Mimosa Colab Club es un ecosistema digital SaaS de intermediación que conecta marcas comerciales con creadoras de contenido UGC. La plataforma facilita la negociación, gestión de órdenes y liquidación de pagos mediante depósito en garantía (escrow), pero no produce contenido por sí misma.</p>
          </section>

          <section>
            <h2>2. Modelo de monetización</h2>
            <p>Las marcas comerciales pagan una suscripción mensual recurrente (Mimosa ForU, Starter o Pro). Las creadoras no pagan suscripción. Adicionalmente, cada colaboración paga una comisión total del 20% sobre el valor pactado: 15% lo añade la marca en el checkout y 5% se retiene del pago a la creadora.</p>
          </section>

          <section>
            <h2>3. Valor mínimo transaccional</h2>
            <p>Ninguna creadora puede fijar una propuesta inicial ni un acuerdo final inferior a $500 MXN por video. La plataforma bloquea técnicamente cualquier valor menor. Las colaboraciones por intercambio físico (producto por contenido) también deben transaccionarse bajo este mínimo como tarifa operativa de gestión.</p>
          </section>

          <section>
            <h2>4. Pagos y escrow</h2>
            <p>Todos los pagos se procesan mediante Stripe. Al crear una orden, el capital de la marca se congela en garantía hasta que el contenido sea aprobado. Está terminantemente prohibido desviar la transacción fuera de la pasarela: las marcas o creadoras que lo intenten serán suspendidas inmediatamente.</p>
          </section>

          <section>
            <h2>5. Correcciones y entregables</h2>
            <p>La marca posee un máximo de 2 rondas de correcciones creativas sobre los videos entregados. Los enlaces rotos, archivos corruptos o videos que no correspondan al producto contratado no se contabilizan como ronda y requieren sustitución inmediata.</p>
            <p>Agotadas las 2 rondas, si el contenido sigue sin alinearse al briefing, la colaboración pasa a estatus “Cancelada/Fallida” y el capital se devuelve a la marca.</p>
          </section>

          <section>
            <h2>6. Facturación</h2>
            <p>Mimosa emite CFDI únicamente por las membresías mensuales y, de requerirse, por la comisión cobrada. La facturación por el trabajo creativo se gestiona directamente entre marca y creadora; cada parte asume sus obligaciones contables y fiscales.</p>
          </section>

          <section>
            <h2>7. Exención de responsabilidad logística</h2>
            <p>Mimosa Colab Club opera únicamente como ecosistema digital. La plataforma no asume responsabilidad legal, económica ni civil en escenarios donde una creadora reciba un producto físico de la marca y posteriormente incumpla con sus obligaciones. Las marcas aceptan explícitamente este riesgo al registrarse.</p>
          </section>

          <section>
            <h2>8. Suspensión de cuentas</h2>
            <p>Mimosa puede suspender temporal o permanentemente cualquier cuenta ante infracciones a estos Términos. Constituyen causales automáticas de suspensión:</p>
            <ul>
              <li>Conductas difamatorias o lenguaje ofensivo en el chat.</li>
              <li>Intentos explícitos de desviar transacciones fuera de Stripe.</li>
              <li>Envío reiterado de entregables vacíos o fraudulentos.</li>
            </ul>
          </section>

          <section>
            <h2>9. Soporte</h2>
            <p>Durante la vigencia del MVP, el soporte se gestiona a través de un canal exclusivo de WhatsApp corporativo, accesible mediante el botón flotante en el dashboard.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export function Privacy() {
  return (
    <div>
      <Navbar />
      <main className="legal">
        <div className="container legal-inner">
          <span className="eyebrow">Documentación legal</span>
          <h1>Aviso de Privacidad</h1>
          <p className="text-muted">Última actualización: 28 de mayo de 2026 · MVP v1.0</p>

          <section>
            <h2>1. Datos que recopilamos</h2>
            <p>Recolectamos información necesaria para operar el marketplace: datos de contacto (nombre, correo), datos fiscales y comerciales de las marcas, portafolio externo y CLABE de las creadoras, historial de campañas, conversaciones de chat y transacciones realizadas en la plataforma.</p>
          </section>

          <section>
            <h2>2. Cómo protegemos tus datos</h2>
            <ul>
              <li><strong>Row Level Security (RLS):</strong> nuestras tablas en Supabase aplican políticas que garantizan que cada usuario solo pueda leer y escribir sus propios registros.</li>
              <li><strong>Cifrado de datos bancarios:</strong> la CLABE de las creadoras se almacena encriptada y se vincula a Stripe Connect; el equipo de Mimosa no puede leer este campo en texto plano.</li>
              <li><strong>HTTPS extremo a extremo:</strong> todas las comunicaciones entre el navegador y nuestros servidores viajan cifradas.</li>
              <li><strong>Procesamiento de pagos certificado:</strong> los datos de tarjeta nunca pasan por nuestros servidores; los maneja Stripe (PCI DSS Nivel 1).</li>
            </ul>
          </section>

          <section>
            <h2>3. Cookies y tecnologías similares</h2>
            <p>Usamos cookies para registrar el consentimiento del usuario y mejorar la experiencia de navegación. Las cookies recomendadas para esta plataforma son:</p>
            <ul>
              <li><strong><code>mimosa_cookie_consent</code>:</strong> registra si el usuario aceptó o rechazó el uso de cookies. Categoría: esencial.</li>
              <li><strong><code>mimosa_analytics</code>:</strong> controla si el usuario aceptó cookies analíticas de rendimiento. Categoría: estadística.</li>
              <li><strong><code>mimosa_last_route</code>:</strong> guarda la última ruta visitada para mejorar la navegación y restaurar el estado del usuario. Categoría: funcional.</li>
            </ul>
            <p>Estas cookies son compatibles con el funcionamiento del frontend y no contienen información sensible. El flujo de autenticación y las sesiones seguras se manejan principalmente con Supabase y no dependen de cookies inseguras en este cliente.</p>
          </section>

          <section>
            <h2>4. Uso de la información</h2>
            <p>Usamos tus datos exclusivamente para: operar el marketplace, procesar pagos en escrow, comunicar el estatus de tus campañas y órdenes, validar perfiles de creadoras, prevenir fraude y resolver disputas.</p>
          </section>

          <section>
            <h2>4. Compartición de datos</h2>
            <p>No vendemos tu información. La compartimos solo con los proveedores estrictamente necesarios para operar el servicio: Supabase (base de datos y autenticación), Stripe (pagos), Netlify (hosting), y proveedores de correo transaccional.</p>
          </section>

          <section>
            <h2>5. Tus derechos (ARCO)</h2>
            <p>Como titular de los datos personales, puedes acceder, rectificar, cancelar u oponerte al tratamiento de tu información. Para ejercer estos derechos, contáctanos por el canal de WhatsApp corporativo.</p>
          </section>

          <section>
            <h2>6. Retención</h2>
            <p>Conservamos tus datos mientras tu cuenta esté activa y durante los plazos requeridos por obligaciones fiscales y contractuales aplicables.</p>
          </section>

          <section>
            <h2>7. Cambios al aviso</h2>
            <p>Podemos actualizar este aviso para reflejar cambios en la plataforma o la legislación aplicable. Notificaremos cambios materiales por correo electrónico.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
