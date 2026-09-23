import { motion } from "framer-motion";
import { Star, Users, Car, Award } from "lucide-react";

const stats = [
  { icon: Star, value: "4.8★", label: "Google Rating" },
  { icon: Users, value: "341+", label: "Happy Reviews" },
  { icon: Car, value: "1M+", label: "Happy Customers" },
  { icon: Award, value: "5+", label: "Years Experience" },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-24" style={{ background: "transparent" }}>
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center px-6 md:px-12 lg:px-20">
          <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: "0.72rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "#C9A84C", marginBottom: "12px" }}>
              About Us
            </p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#1A1814", WebkitTextFillColor: "#1A1814", marginBottom: "20px", lineHeight: 1.15 }}>
              Chennai's Most <span style={{ color: "#C9A84C", WebkitTextFillColor: "#C9A84C" }}>Trusted</span> Auto Care
            </h2>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: "0.95rem", color: "#6B6357", lineHeight: 1.8, marginBottom: "16px" }}>
              Xtreme Car Care is one of Chennai's most trusted car detailing and restoration studios. With over 1M+ happy customers and a 4.8 star rating, we specialize in high-quality detailing, paint protection, and automotive upgrades.
            </p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: "0.9rem", color: "#6B6357", lineHeight: 1.8, marginBottom: "28px" }}>
              Our team of trained professionals uses only premium products and state-of-the-art equipment to ensure your vehicle receives the best care possible. From basic washes to complete ceramic coatings, we treat every car like it's our own.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ height: "1px", width: "48px", background: "#C9A84C" }} />
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 600, letterSpacing: "0.18em", fontSize: "0.7rem", textTransform: "uppercase", color: "#C9A84C" }}>
                Excellence In Every Detail
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div style={{ position: "relative", overflow: "hidden", borderRadius: "4px" }}>
              <img
                src="/images/hero-slider/hero1.jpeg"
                alt="Xtreme Car Care shop"
                style={{ width: "100%", height: "300px", objectFit: "cover", display: "block" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(255,254,245,0.3), transparent)" }} />
            </div>

            <div className="grid grid-cols-2 gap-px mt-px" style={{ background: "#E8E0D0" }}>
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  style={{ background: "#FFFFFF", padding: "20px", textAlign: "center" }}
                >
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, fontSize: "1.8rem", color: "#C9A84C", WebkitTextFillColor: "#C9A84C" }}>
                    {stat.value}
                  </p>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: "0.75rem", color: "#6B6357", marginTop: "4px", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
