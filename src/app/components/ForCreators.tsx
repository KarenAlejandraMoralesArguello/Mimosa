import { motion } from "motion/react";
import { DollarSign, Calendar, TrendingUp, Award } from "lucide-react";
import { Button } from "@mui/material";

const benefits = [
  {
    icon: DollarSign,
    title: "Monetiza tu Talento",
    description: "Gana dinero creando contenido para marcas que amas",
  },
  {
    icon: Calendar,
    title: "Flexibilidad Total",
    description: "Trabaja cuando quieras, desde donde quieras",
  },
  {
    icon: TrendingUp,
    title: "Crece tu Carrera",
    description: "Construye tu portfolio y expande tu red de contactos",
  },
  {
    icon: Award,
    title: "Reconocimiento",
    description: "Destaca y gana premios por tu mejor contenido",
  },
];

export function ForCreators() {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-[#8338ec] to-[#3a86ff] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff006e] rounded-full blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#ffbe0b] rounded-full blur-3xl opacity-20"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Para Creadores
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Convierte tu creatividad en ingresos. Conecta con marcas que buscan exactamente lo que tú ofreces.
            </p>

            <div className="space-y-6 mb-8">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#ffbe0b] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-[#1a1a2e]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-white/80">
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
                backgroundColor: "#ffbe0b",
                color: "#1a1a2e",
                fontSize: "1.125rem",
                padding: "16px 48px",
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: "#fb5607",
                  transform: "scale(1.05)",
                  transition: "all 0.3s ease",
                },
              }}
            >
              Únete como Creador
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-2 border-white/20">
              <div className="aspect-video bg-gradient-to-br from-[#ff006e] to-[#ffbe0b] rounded-2xl flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-6xl mb-4">🎥</div>
                  <p className="text-2xl font-bold">Tu Contenido</p>
                  <p className="text-lg">Tu Éxito</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
