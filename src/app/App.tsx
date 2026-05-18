import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { ForCreators } from "./components/ForCreators";
import { ForBrands } from "./components/ForBrands";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen">
      <Hero />
      <HowItWorks />
      <ForCreators />
      <ForBrands />
      <CTA />
      <Footer />
    </div>
  );
}