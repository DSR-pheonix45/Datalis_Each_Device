import { useTheme } from "../context/ThemeContext";
import { useEffect, useState } from "react";
import Hero from "../components/landing/Hero";
import FeaturesGrid from "../components/landing/FeaturesGrid";
import InteractiveWorkflow from "../components/landing/InteractiveWorkflow";
import Testimonial from "../components/landing/Testimonial";
import WhyChoose from "../components/landing/WhyChoose";
import FinalCTA from "../components/landing/FinalCTA";
import FAQ from "../components/landing/FAQ";

export default function Home() {
  const { theme } = useTheme();
  const [bgSize, setBgSize] = useState("100% auto");

  useEffect(() => {
    const updateBgSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        // Mobile: scale up the pattern so it's visible
        setBgSize("300% auto");
      } else if (width < 1024) {
        // Tablet
        setBgSize("180% auto");
      } else {
        // Desktop
        setBgSize("100% auto");
      }
    };

    updateBgSize();
    window.addEventListener("resize", updateBgSize);
    return () => window.removeEventListener("resize", updateBgSize);
  }, []);

  return (
    <div
      className={`min-h-screen relative ${
        theme === "dark" ? "bg-[#0a0a0a]" : "bg-[#d5d5d5]"
      }`}
      style={{
        backgroundImage: `url('/${
          theme === "dark" ? "bg-pattern.png" : "Basic Set (3).png"
        }')`,
        backgroundSize: bgSize,
        backgroundPosition: "top center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Content */}
      <div className="relative z-10">
        <main>
          <Hero />
          <FeaturesGrid />
          <InteractiveWorkflow />
          <Testimonial />
          <WhyChoose />
          <FAQ />
          <FinalCTA />
        </main>
      </div>
    </div>
  );
}
