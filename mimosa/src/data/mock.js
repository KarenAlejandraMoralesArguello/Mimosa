// Datos de demostración para el MVP de Mimosa Colab Club.
// Reemplazables por Supabase en la fase de backend.

export const PLANS = [
  {
    id: 'foru',
    name: 'Mimosa ForU',
    price: 499,
    limit: 'Hasta 3 campañas activas simultáneas / mes',
    perks: [
      'Acceso completo al catálogo homologado de creadoras',
      'Selección libre de talento',
      'Postulaciones orgánicas tras publicar campaña',
    ],
    grad: 'var(--grad-solar-rosa)',
  },
  {
    id: 'starter',
    name: 'Mimosa Starter',
    price: 799,
    limit: 'Hasta 6 campañas activas simultáneas / mes',
    perks: [
      'Ideal para marcas medianas en aceleración',
      'Matches ilimitados dentro de los créditos del plan',
      'Mismos términos de uso que ForU',
    ],
    featured: true,
    grad: 'var(--grad-rosa-violeta)',
  },
  {
    id: 'pro',
    name: 'Mimosa Pro',
    price: 1199,
    limit: 'Hasta 12 campañas activas simultáneas / mes',
    perks: [
      'Para grandes corporativos con alta rotación',
      'Máxima capacidad de publicación en el marketplace',
      'Demanda masiva de contenido UGC mensual',
    ],
    grad: 'var(--grad-violeta-azul)',
  },
]

export const MIN_VIDEO_PRICE = 500

// --- Marca: campañas ---
export const CAMPAIGNS = [
  {
    id: 'c1',
    title: 'Unboxing serum facial — línea Glow',
    brand: 'Lumière Skincare',
    style: 'Unboxing',
    duration: 30,
    videos: 3,
    budget: 1500,
    status: 'activa',
    deadlineHours: 92,
    applicants: 4,
    brief: 'Buscamos 3 videos verticales de 30s mostrando la experiencia de apertura del kit Glow, tono fresco y aspiracional. Iluminación natural.',
  },
  {
    id: 'c2',
    title: 'Reseña auténtica — tenis runner Volt',
    brand: 'Volt Athletics',
    style: 'Reseña',
    duration: 45,
    videos: 2,
    budget: 1400,
    status: 'pendiente',
    deadlineHours: null,
    applicants: 0,
    brief: 'Reseña honesta de uso real durante una semana. Mostrar comodidad, diseño y desempeño en exteriores.',
  },
  {
    id: 'c3',
    title: 'UGC acting — bebida energética Pulse',
    brand: 'Pulse Drinks',
    style: 'Acting',
    duration: 20,
    videos: 4,
    budget: 2000,
    status: 'activa',
    deadlineHours: 18,
    applicants: 7,
    brief: 'Mini sketches divertidos consumiendo Pulse antes del gym. Energía alta, formato trend.',
  },
]

// --- Creadora: marketplace (campañas públicas para aplicar) ---
const GRADS = ['var(--grad-naranja-solar)', 'var(--grad-solar-rosa)', 'var(--grad-rosa-violeta)', 'var(--grad-violeta-azul)', 'var(--grad-verde-azul)']
export const MARKETPLACE = [
  { id: 'm1', title: 'UGC acting — bebida energética Pulse', brand: 'Pulse Drinks', style: 'Acting', duration: 20, videos: 4, refBudget: 2000, deadlineHours: 18 },
  { id: 'm2', title: 'Unboxing serum facial — línea Glow', brand: 'Lumière Skincare', style: 'Unboxing', duration: 30, videos: 3, refBudget: 1500, deadlineHours: 92 },
  { id: 'm3', title: 'Tutorial recetas — licuadora NovaBlend', brand: 'Nova Home', style: 'UGC', duration: 60, videos: 2, refBudget: 1800, deadlineHours: 140 },
  { id: 'm4', title: 'Reseña honesta — audífonos AuraBeats', brand: 'AuraBeats', style: 'Reseña', duration: 45, videos: 2, refBudget: 1700, deadlineHours: 72 },
  { id: 'm5', title: 'Día en mi vida con café Volta', brand: 'Volta Coffee', style: 'UGC', duration: 30, videos: 3, refBudget: 1500, deadlineHours: 200 },
  { id: 'm6', title: 'Unboxing kit maquillaje Bloom', brand: 'Bloom Beauty', style: 'Unboxing', duration: 40, videos: 2, refBudget: 1600, deadlineHours: 38 },
  { id: 'm7', title: 'Acting — snack saludable Crujie', brand: 'Crujie', style: 'Acting', duration: 25, videos: 5, refBudget: 2500, deadlineHours: 110 },
  { id: 'm8', title: 'Reseña — protector solar Solaria', brand: 'Solaria Skin', style: 'Reseña', duration: 45, videos: 2, refBudget: 1500, deadlineHours: 16 },
  { id: 'm9', title: 'UGC outfits — moda Lunarry', brand: 'Lunarry', style: 'UGC', duration: 30, videos: 4, refBudget: 2200, deadlineHours: 160 },
  { id: 'm10', title: 'Unboxing pijama premium Velvy', brand: 'Velvy', style: 'Unboxing', duration: 25, videos: 2, refBudget: 1400, deadlineHours: 60 },
  { id: 'm11', title: 'Acting cocina — sartén ChefPro', brand: 'ChefPro', style: 'Acting', duration: 35, videos: 3, refBudget: 1900, deadlineHours: 88 },
  { id: 'm12', title: 'Reseña libro — editorial Tinta', brand: 'Editorial Tinta', style: 'Reseña', duration: 60, videos: 1, refBudget: 1200, deadlineHours: 240 },
  { id: 'm13', title: 'UGC fit — leggings Movva', brand: 'Movva Activewear', style: 'UGC', duration: 30, videos: 3, refBudget: 1800, deadlineHours: 14 },
  { id: 'm14', title: 'Unboxing dispositivo NestPet', brand: 'NestPet', style: 'Unboxing', duration: 40, videos: 2, refBudget: 1700, deadlineHours: 100 },
  { id: 'm15', title: 'Acting morning — yogurt Greekly', brand: 'Greekly', style: 'Acting', duration: 20, videos: 4, refBudget: 2000, deadlineHours: 130 },
  { id: 'm16', title: 'Reseña electrodoméstico — VentaFresh', brand: 'VentaFresh', style: 'Reseña', duration: 50, videos: 2, refBudget: 1600, deadlineHours: 175 },
  { id: 'm17', title: 'UGC tendencia — bebida Frutto', brand: 'Frutto Drinks', style: 'UGC', duration: 25, videos: 5, refBudget: 2400, deadlineHours: 64 },
  { id: 'm18', title: 'Unboxing vela aromática Lume', brand: 'Lume', style: 'Unboxing', duration: 30, videos: 2, refBudget: 1300, deadlineHours: 22 },
].map((c, i) => ({ ...c, grad: GRADS[i % GRADS.length] }))

// Estilos disponibles para filtros del marketplace.
export const MARKET_STYLES = ['UGC', 'Unboxing', 'Reseña', 'Acting']

// --- Postulantes a una campaña (vista marca) ---
export const APPLICANTS = [
  {
    id: 'a1',
    name: 'Valentina Ríos',
    handle: '@valeugc',
    proposal: 'Propongo abrir el kit con un POV matutino y cierre con primer plano del producto sobre mármol. Tono cálido.',
    price: 520,
    verified: true,
    portfolio: 'https://www.behance.net/',
    rating: 4.9,
  },
  {
    id: 'a2',
    name: 'Camila Fuentes',
    handle: '@cami.creates',
    proposal: 'Storytelling de rutina nocturna + resultado a 7 días. Estilo cinematográfico vertical.',
    price: 600,
    verified: true,
    portfolio: 'https://www.tiktok.com/',
    rating: 4.7,
  },
  {
    id: 'a3',
    name: 'Dafne Luna',
    handle: '@dafnemakes',
    proposal: 'Unboxing ASMR con texturas y sonido limpio, ideal para enganchar en los primeros 3 segundos.',
    price: 500,
    verified: false,
    portfolio: 'https://drive.google.com/',
    rating: 4.5,
  },
]

// --- Mensajes del chat de negociación ---
export const CHAT_MESSAGES = [
  { id: 1, from: 'brand', name: 'Lumière Skincare', text: 'Hola Valentina, nos encantó tu propuesta. ¿Podrías hacer 3 videos de 30s?', time: '10:02' },
  { id: 2, from: 'creator', name: 'Valentina Ríos', text: '¡Hola! Claro que sí. Por 3 videos manejaría $1,500 MXN en total.', time: '10:05' },
  { id: 3, from: 'brand', name: 'Lumière Skincare', text: 'Perfecto. Te paso el brief en PDF como referencia.', time: '10:06', file: 'brief-glow.pdf' },
  { id: 4, from: 'creator', name: 'Valentina Ríos', text: 'Recibido. Quedo lista para arrancar en cuanto crees la orden.', time: '10:08' },
]

// --- Órdenes (escrow) ---
export const ORDERS = [
  {
    id: 'o1',
    campaign: 'Unboxing serum facial — línea Glow',
    creator: 'Valentina Ríos',
    brand: 'Lumière Skincare',
    videos: 3,
    base: 1500,
    status: 'en_curso',
    deadline: '2026-06-04',
    deadlineHours: 92,
  },
  {
    id: 'o2',
    campaign: 'UGC acting — bebida energética Pulse',
    creator: 'Camila Fuentes',
    brand: 'Pulse Drinks',
    videos: 4,
    base: 2000,
    status: 'entregado',
    deadline: '2026-05-27',
    deadlineHours: 18,
    deliveryUrl: 'https://drive.google.com/drive/folders/demo-entrega',
  },
  {
    id: 'o3',
    campaign: 'Tutorial recetas — licuadora NovaBlend',
    creator: 'Dafne Luna',
    brand: 'Nova Home',
    videos: 2,
    base: 1800,
    status: 'completado',
    deadline: '2026-05-12',
    deadlineHours: 0,
  },
]

// --- Panel admin: creadoras en validación ---
export const PENDING_CREATORS = [
  { id: 'p1', name: 'Renata Gil', handle: '@renata.ugc', portfolio: 'https://www.behance.net/', submitted: '2026-05-24', status: 'en_validacion' },
  { id: 'p2', name: 'Isabela Mora', handle: '@isaugc', portfolio: 'https://www.canva.com/', submitted: '2026-05-25', status: 'en_validacion' },
]

export const PENDING_CAMPAIGNS = [
  { id: 'pc1', title: 'Reseña auténtica — tenis runner Volt', brand: 'Volt Athletics', submitted: '2026-05-25' },
]

// --- Finanzas (PRD §5.1) ---
export const TAKE_RATE = { brand: 0.15, creator: 0.05, total: 0.20 }

export function quote(base) {
  return {
    base,
    brandPays: Math.round(base * (1 + TAKE_RATE.brand)),
    creatorGets: Math.round(base * (1 - TAKE_RATE.creator)),
    mimosa: Math.round(base * TAKE_RATE.total),
  }
}

export const STATUS_MAP = {
  activa: { label: 'Colaboración en curso', badge: 'badge-verde' },
  en_curso: { label: 'En curso', badge: 'badge-verde' },
  pendiente: { label: 'Pendiente por aceptar', badge: 'badge-solar' },
  en_validacion: { label: 'En validación', badge: 'badge-solar' },
  entregado: { label: 'Entregado · pendiente revisión', badge: 'badge-azul' },
  completado: { label: 'Completado', badge: 'badge-verde' },
  cancelado: { label: 'Cancelada / fallida', badge: 'badge-muted' },
  verificado: { label: 'Verificada', badge: 'badge-verde' },
}
