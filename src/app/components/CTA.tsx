import { motion } from "motion/react";
import { Button } from "@mui/material";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-24 px-6 bg-gradient-to-r from-[#ff006e] via-[#8338ec] to-[#3a86ff] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            ¿Listo para Crear Magia?
          </h2>

          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
            Únete a MIMOSA hoy y empieza a conectar, crear y crecer
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowRight />}
              sx={{
                backgroundColor: "#ffbe0b",
                color: "#1a1a2e",
                fontSize: "1.25rem",
                padding: "20px 56px",
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
              Comenzar Ahora
            </Button>

            <Button
              variant="text"
              size="large"
              sx={{
                color: "white",
                fontSize: "1.125rem",
                padding: "20px 40px",
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
                textDecoration: "underline",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              Ver Demo
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-white">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">100%</div>
              <div className="text-white/80">Gratis para empezar</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">24/7</div>
              <div className="text-white/80">Soporte dedicado</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">0%</div>
              <div className="text-white/80">Comisión primer mes</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
