import { motion } from "motion/react";
import { Target, Zap, BarChart3, Shield } from "lucide-react";
import { Button } from "@mui/material";

const benefits = [
  {
    icon: Target,
    title: "Alcance Auténtico",
    description: "Contenido real de personas reales que resuena con tu audiencia",
  },
  {
    icon: Zap,
    title: "Resultados Rápidos",
    description: "Lanza campañas en días, no en meses",
  },
  {
    icon: BarChart3,
    title: "ROI Medible",
    description: "Analítica clara para medir el impacto de cada campaña",
  },
  {
    icon: Shield,
    title: "Calidad Garantizada",
    description: "Creadores verificados y contenido de alta calidad",
  },
];

export function ForBrands() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-2 lg:order-1"
          >
            <div className="relative bg-gradient-to-br from-[#ff006e] to-[#8338ec] rounded-3xl p-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 aspect-square flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-white mb-2">500+</div>
                  <div className="text-white/90 text-center">Creadores</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 aspect-square flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-white mb-2">1K+</div>
                  <div className="text-white/90 text-center">Campañas</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 aspect-square flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-white mb-2">98%</div>
                  <div className="text-white/90 text-center">Satisfacción</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 aspect-square flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-white mb-2">3X</div>
                  <div className="text-white/90 text-center">ROI Promedio</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#ff006e] via-[#8338ec] to-[#3a86ff] bg-clip-text text-transparent">
              Para Marcas
            </h2>
            <p className="text-xl text-[#6c757d] mb-8">
              Escala tu contenido con creadores que conocen a tu audiencia. Impulsa ventas con videos UGC que convierten.
            </p>

            <div className="space-y-6 mb-8">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-start gap-4 bg-[#f8f9fa] rounded-2xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff006e] to-[#8338ec] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#1a1a2e] mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-[#6c757d]">
                        {benefit.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <Button
              variant="contained"
              size="large"
              sx={{
                background: "linear-gradient(135deg, #ff006e 0%, #8338ec 100%)",
                color: "white",
                fontSize: "1.125rem",
                padding: "16px 48px",
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  background: "linear-gradient(135deg, #8338ec 0%, #3a86ff 100%)",
                  transform: "scale(1.05)",
                  transition: "all 0.3s ease",
                },
              }}
            >
              Lanza tu Campaña
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
