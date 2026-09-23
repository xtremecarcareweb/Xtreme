import { motion } from "framer-motion";

type GalleryItem = {
  src: string;
  alt: string;
  label: string;
  type?: "image" | "video";
  poster?: string;
};

const galleryItems: GalleryItem[] = [
  { src: "/images/services/business-class-customization.jpeg", alt: "Business Class Customisation", label: "Business Class Customisation" },
  { src: "/images/services/full-car-customization.jpeg", alt: "Full Car Customisation", label: "Full Car Customisation" },
  { src: "/images/services/ppf.jpeg", alt: "Paint Protection Film (PPF)", label: "Paint Protection Film (PPF)" },
  { src: "/images/services/ceramic-coating.jpeg", alt: "Ceramic Coating", label: "Ceramic Coating" },
  { src: "/images/services/body-kit.jpeg", alt: "Body Kits", label: "Body Kits" },
  { src: "/images/services/premium-infotainment-system.jpeg", alt: "Premium Infotainment Systems", label: "Premium Infotainment Systems" },
  { src: "/images/services/car-accessories.jpeg", alt: "Accessories", label: "Accessories" },
  { src: "/images/services/gold-package.jpeg", alt: "Gold Package", label: "Gold Package" },
  { src: "/images/services/automatic car wash.jpeg", alt: "Automatic Car Wash", label: "Automatic Car Wash" },
];

export default function GallerySection() {
  return (
    <section id="gallery" className="py-24" style={{ background: "transparent" }}>
      <div className="w-full">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center mb-14 px-4">
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: "0.72rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "#C9A84C", marginBottom: "10px" }}>
            Gallery
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#1A1814", WebkitTextFillColor: "#1A1814" }}>
            Explore Our Recent Work
          </h2>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.9rem", color: "#6B6357", marginTop: "10px", maxWidth: "480px", margin: "12px auto 0" }}>
            Discover some of the latest projects and services we have completed for our valued customers.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: "#E8E0D0" }}>
          {galleryItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative overflow-hidden cursor-pointer"
              style={{ aspectRatio: "16/9" }}
            >
              {item.type === "video" && item.src ? (
                <video src={item.src} poster={item.poster} controls preload="metadata" className="h-full w-full object-cover" aria-label={item.alt} />
              ) : item.type === "video" ? (
                <div style={{ height: "100%", width: "100%", background: "#F0EBE0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", color: "#6B6357" }}>Video coming soon</p>
                </div>
              ) : (
                <img src={item.src} alt={item.alt} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              )}
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(26,24,20,0.7) 0%, rgba(26,24,20,0.1) 50%, transparent 100%)", transition: "opacity 0.3s" }} />
              <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none">
                <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, fontSize: "0.95rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#FFFEF5", WebkitTextFillColor: "#FFFEF5" }}>
                  {item.label}
                </p>
                <div style={{ height: "1px", width: "32px", background: "#C9A84C", marginTop: "8px", transition: "width 0.3s" }} className="group-hover:w-16" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
