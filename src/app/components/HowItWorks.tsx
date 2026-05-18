import { motion } from "motion/react";
import { Search, Handshake, Video, Rocket } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Encuentra tu Match",
    description: "Marcas descubren creadores perfectos. Creadores encuentran campañas ideales.",
    color: "#ff006e",
  },
  {
    icon: Handshake,
    title: "Conecta y Acuerda",
    description: "Negocia términos, expectativas y entregables de forma transparente.",
    color: "#8338ec",
  },
  {
    icon: Video,
    title: "Crea Contenido",
    description: "Los creadores producen videos UGC auténticos y de alta calidad.",
    color: "#3a86ff",
  },
  {
    icon: Rocket,
    title: "Lanza y Crece",
    description: "Las marcas usan el contenido para impulsar sus ventas y engagement.",
    color: "#ffbe0b",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-white to-[#f8f9fa]">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#ff006e] via-[#8338ec] to-[#3a86ff] bg-clip-text text-transparent">
            ¿Cómo Funciona?
          </h2>
          <p className="text-xl text-[#6c757d] max-w-2xl mx-auto">
            Cuatro pasos simples para crear campañas de UGC increíbles
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 h-full border-2 border-transparent hover:border-[var(--step-color)]"
                  style={{ "--step-color": step.color } as React.CSSProperties}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: step.color }}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <div className="text-4xl font-bold mb-4" style={{ color: step.color }}>
                    {(index + 1).toString().padStart(2, '0')}
                  </div>

                  <h3 className="text-2xl font-bold mb-3 text-[#1a1a2e]">
                    {step.title}
                  </h3>

                  <p className="text-[#6c757d]">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
