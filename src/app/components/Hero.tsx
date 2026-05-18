import { motion } from "motion/react";
import { Sparkles, Video, Users } from "lucide-react";
import { Button } from "@mui/material";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#ff006e] via-[#8338ec] to-[#3a86ff] py-24 px-6">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-8"
          >
            <Sparkles className="w-5 h-5 text-[#ffbe0b]" />
            <span className="text-white">La plataforma de UGC que estabas esperando</span>
          </motion.div>

          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight">
            MIMOSA
          </h1>

          <p className="text-xl md:text-2xl text-white/90 mb-4 max-w-3xl mx-auto">
            Conectamos creadores de contenido con marcas
          </p>

          <p className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl mx-auto">
            La marketplace donde nacen las mejores campañas de video UGC
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
              Soy Creador
            </Button>

            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: "white",
                color: "white",
                fontSize: "1.125rem",
                padding: "16px 48px",
                borderRadius: "12px",
                borderWidth: "2px",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "white",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderWidth: "2px",
                  transform: "scale(1.05)",
                  transition: "all 0.3s ease",
                },
              }}
            >
              Soy Marca
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-white"
        >
          <div className="flex flex-col items-center text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
            <Video className="w-12 h-12 mb-4 text-[#ffbe0b]" />
            <h3 className="text-2xl font-bold mb-2">Videos UGC</h3>
            <p className="text-white/80">Contenido auténtico que convierte</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
            <Users className="w-12 h-12 mb-4 text-[#ffbe0b]" />
            <h3 className="text-2xl font-bold mb-2">Creadores Verificados</h3>
            <p className="text-white/80">Red de talentos de confianza</p>
          </div>

          <div className="flex flex-col items-center text-center p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
            <Sparkles className="w-12 h-12 mb-4 text-[#ffbe0b]" />
            <h3 className="text-2xl font-bold mb-2">Campañas Efectivas</h3>
            <p className="text-white/80">Resultados medibles y reales</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
