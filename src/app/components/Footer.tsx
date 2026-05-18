import { Instagram, Twitter, Linkedin, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#1a1a2e] text-white py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#ff006e] via-[#8338ec] to-[#3a86ff] bg-clip-text text-transparent">
              MIMOSA
            </h3>
            <p className="text-white/70 mb-6">
              La plataforma que conecta creadores con marcas para crear contenido UGC increíble.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#ff006e] transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#8338ec] transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#3a86ff] transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#ffbe0b] transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4">Para Creadores</h4>
            <ul className="space-y-2 text-white/70">
              <li><a href="#" className="hover:text-[#ff006e] transition-colors">Cómo Funciona</a></li>
              <li><a href="#" className="hover:text-[#ff006e] transition-colors">Registrarse</a></li>
              <li><a href="#" className="hover:text-[#ff006e] transition-colors">Recursos</a></li>
              <li><a href="#" className="hover:text-[#ff006e] transition-colors">Casos de Éxito</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Para Marcas</h4>
            <ul className="space-y-2 text-white/70">
              <li><a href="#" className="hover:text-[#8338ec] transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-[#8338ec] transition-colors">Casos de Uso</a></li>
              <li><a href="#" className="hover:text-[#8338ec] transition-colors">Crear Campaña</a></li>
              <li><a href="#" className="hover:text-[#8338ec] transition-colors">ROI Calculator</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">Compañía</h4>
            <ul className="space-y-2 text-white/70">
              <li><a href="#" className="hover:text-[#3a86ff] transition-colors">Sobre Nosotros</a></li>
              <li><a href="#" className="hover:text-[#3a86ff] transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-[#3a86ff] transition-colors">Contacto</a></li>
              <li><a href="#" className="hover:text-[#3a86ff] transition-colors">Careers</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/70 text-sm">
              © 2026 MIMOSA. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm text-white/70">
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Términos</a>
              <a href="#" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
