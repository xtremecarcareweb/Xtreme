import { motion } from "framer-motion";
import { useState } from "react";
import { type LucideIcon, BadgeCheck, CarFront, Crown, Gauge, Gem, Play, Sparkles, Wand2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getServiceVideo } from "@/lib/serviceVideos";

type Service = {
  title: string;
  description: string;
  featured?: boolean;
  tag?: string;
  category: string;
  accent: string;
  icon: LucideIcon;
  detail: string;
  points: string[];
};

const services: Service[] = [
  {
    title: "Business Class Customisation",
    description:
      "Step into luxury. Our business class upgrades transform your vehicle into a true executive lounge on wheels for every journey.",
    featured: true,
    tag: "FLAGSHIP",
    category: "Executive Interior",
    accent: "#C9A84C",
    icon: Crown,
    detail: "Cabin-first refinement for daily driving and long-distance comfort.",
    points: ["Premium seating and trim", "Quiet, lounge-like atmosphere"],
  },
  {
    title: "Full Car Customisation",
    description:
      "Dream it, drive it. We craft bespoke transformations that make your vehicle a true reflection of your character and lifestyle.",
    category: "Complete Transformation",
    accent: "#8F7B54",
    icon: Wand2,
    detail: "A full-scope build that ties every detail into one coherent finish.",
    points: ["Interior and exterior coordination", "Tailored from concept to delivery"],
  },
  {
    title: "Body Kits",
    description:
      "Sculpted to perfection. Our custom body kits deliver aerodynamic precision and an unmistakably bold presence on every road.",
    category: "Exterior Aerodynamics",
    accent: "#A56B3F",
    icon: CarFront,
    detail: "Sharper lines, stronger stance, and a more purposeful road presence.",
    points: ["Precision-fit components", "Balanced performance styling"],
  },
  {
    title: "Premium Infotainment Systems",
    description:
      "Seamlessly connected. Upgrade to the finest entertainment and navigation technology for an immersive in-cabin experience.",
    category: "Smart Cabin Tech",
    accent: "#5A6572",
    icon: Sparkles,
    detail: "A clean digital upgrade that feels integrated rather than added on.",
    points: ["Navigation and media clarity", "Modern convenience with a classic finish"],
  },
  {
    title: "Accessories",
    description:
      "The finishing touches that define excellence. From sporty add-ons to refined practical upgrades, every detail is considered.",
    category: "Refined Details",
    accent: "#6C5A4A",
    icon: Gem,
    detail: "Selective enhancements that complete the look without overwhelming it.",
    points: ["Interior and exterior add-ons", "Subtle upgrades with purpose"],
  },
  {
    title: "Automatic Car Wash",
    description:
      "Effortless brilliance. Our touchless precision wash delivers a showroom-quality finish in minutes, every time.",
    category: "Preservation Care",
    accent: "#79A0A8",
    icon: Gauge,
    detail: "A fast, careful clean designed to keep surfaces pristine.",
    points: ["Gentle touchless process", "Showroom-level finish"],
  },
  {
    title: "Gold Package",
    description:
      "The pinnacle of automotive care. Our all-encompassing signature package delivers the ultimate transformation for your prized vehicle.",
    category: "Signature Package",
    tag: "BEST VALUE",
    accent: "#C9A84C",
    icon: BadgeCheck,
    detail: "The most complete expression of our craftsmanship and care.",
    points: ["Best for comprehensive upgrades", "Balanced across style and protection"],
  },
];

export default function ServicesSection() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const selectedServiceVideo = selectedService ? getServiceVideo(selectedService.title) : { videoSrc: "", videoEmbedUrl: "" };

  return (
    <section
      id="services"
      className="py-20 md:py-28 lg:py-36 relative overflow-x-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(255,254,245,0.90) 0%, rgba(255,250,240,0.86) 100%)",
      }}
    >
      {/* Background ornament */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,0.10) 0%, transparent 70%), linear-gradient(180deg, rgba(255,254,245,0.34) 0%, rgba(255,254,245,0.16) 100%)",
        }}
      />

      <div className="w-full relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-16 text-center px-6"
        >
          <p
            style={{
              fontFamily: "'Jost', sans-serif",
              fontWeight: 500,
              fontSize: "0.7rem",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "#C9A84C",
              marginBottom: "16px",
            }}
          >
            What We Offer
          </p>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 400,
              fontSize: "clamp(2.2rem, 4.5vw, 3.6rem)",
              color: "#1A1814",
              lineHeight: 1.1,
              letterSpacing: "0.01em",
            }}
          >
            Our{" "}
            <span
              style={{
                background: "linear-gradient(130deg, #E8C96A 0%, #C9A84C 40%, #F5DC85 70%, #C9A84C 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Premium Services
            </span>
          </h2>
          {/* Ornamental divider */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center", marginTop: "20px" }}>
            <span style={{ display: "inline-block", width: "60px", height: "1px", background: "linear-gradient(to right, transparent, rgba(201,168,76,0.6))" }} />
            <span style={{ color: "#C9A84C", fontSize: "0.42rem", letterSpacing: "0.3em" }}>◆◆◆</span>
            <span style={{ display: "inline-block", width: "60px", height: "1px", background: "linear-gradient(to left, transparent, rgba(201,168,76,0.6))" }} />
          </div>
          <p
            style={{
              fontFamily: "'Jost', sans-serif",
              fontWeight: 300,
              fontSize: "clamp(0.9rem, 1.6vw, 1.02rem)",
              color: "rgba(60,55,45,0.68)",
              marginTop: "16px",
              letterSpacing: "0.045em",
              maxWidth: "560px",
              margin: "16px auto 0",
              lineHeight: 1.8,
            }}
          >
            Each service is delivered with obsessive attention to detail and an unwavering commitment to perfection.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px mx-0 border-y border-[#E8E0D0]"
          style={{ background: "#E8E0D0" }}
        >
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: i * 0.06 }}
              className="group relative flex min-h-[420px] flex-col items-start px-8 py-10 cursor-pointer overflow-hidden border border-[#E8E0D0]"
              style={{
                background:
                  i % 2 === 0
                    ? "linear-gradient(180deg, rgba(255,254,245,0.98) 0%, rgba(252,248,239,0.96) 100%)"
                    : "linear-gradient(180deg, rgba(250,246,237,0.98) 0%, rgba(247,241,230,0.96) 100%)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 22px 50px rgba(26,24,20,0.05)",
                transition: "transform 0.28s ease, box-shadow 0.28s ease, background 0.28s ease, border-color 0.28s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 30px 60px rgba(26,24,20,0.1)";
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.28)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 22px 50px rgba(26,24,20,0.05)";
                e.currentTarget.style.borderColor = "#E8E0D0";
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{
                  background: `linear-gradient(to right, transparent 0%, ${service.accent} 22%, ${service.accent} 78%, transparent 100%)`,
                  opacity: 0.9,
                }}
              />

              <div className="mb-6 flex w-full items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: service.accent,
                      letterSpacing: "0.18em",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{ width: "34px", height: "1px", background: service.accent, opacity: 0.35 }} />
                </div>

                <div
                  style={{
                    background: service.tag ? "rgba(201,168,76,0.08)" : "rgba(0,0,0,0.02)",
                    border: `1px solid ${service.tag ? "rgba(201,168,76,0.25)" : "rgba(26,24,20,0.08)"}`,
                    borderRadius: "2px",
                    padding: "4px 10px",
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.62rem",
                    letterSpacing: "0.22em",
                    color: service.tag ? "#C9A84C" : "rgba(26,24,20,0.62)",
                    textTransform: "uppercase",
                    boxShadow: service.tag ? "0 4px 14px rgba(201,168,76,0.10)" : "none",
                  }}
                >
                  {service.tag || service.category}
                </div>
              </div>

              <div
                style={{
                  width: "64px",
                  height: "64px",
                  border: `1px solid ${service.accent}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "22px",
                  borderRadius: "2px",
                  background: `linear-gradient(180deg, ${service.accent}10 0%, rgba(255,255,255,0.96) 100%)`,
                  color: service.accent,
                  flexShrink: 0,
                  boxShadow: "0 8px 24px rgba(26,24,20,0.04)",
                }}
              >
                <service.icon size={28} strokeWidth={1.8} />
              </div>

              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 600,
                  fontSize: "clamp(1.72rem, 2.1vw, 2.02rem)",
                  color: "#1A1814",
                  textAlign: "left",
                  marginBottom: "12px",
                  letterSpacing: "0.015em",
                  lineHeight: 1.15,
                }}
              >
                {service.title}
              </h3>

              <div
                style={{
                  width: "42px",
                  height: "1px",
                  background: `linear-gradient(to right, ${service.accent}, transparent)`,
                  marginBottom: "10px",
                }}
              />

              <p
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontWeight: 500,
                  fontSize: "0.72rem",
                  color: service.accent,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  marginBottom: "14px",
                }}
              >
                {service.category}
              </p>

              <p
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontWeight: 300,
                  fontSize: "1rem",
                  color: "rgba(90,82,71,0.92)",
                  lineHeight: 1.9,
                  textAlign: "left",
                  marginBottom: "16px",
                  flex: 1,
                }}
              >
                {service.description}
              </p>

              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 600,
                  fontSize: "1.02rem",
                  color: "#1A1814",
                  lineHeight: 1.5,
                  marginBottom: "18px",
                }}
              >
                {service.detail}
              </p>

              <ul
                style={{
                  display: "grid",
                  gap: "10px",
                  marginBottom: "26px",
                  paddingLeft: 0,
                  listStyle: "none",
                  width: "100%",
                }}
              >
                {service.points.map((point) => (
                  <li
                    key={point}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontFamily: "'Jost', sans-serif",
                      fontSize: "0.92rem",
                      color: "rgba(60,55,45,0.84)",
                      lineHeight: 1.6,
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        marginTop: "0.55rem",
                        borderRadius: "999px",
                        background: service.accent,
                        flexShrink: 0,
                      }}
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <div
                style={{
                  width: "100%",
                  height: "1px",
                  marginBottom: "18px",
                  background: "linear-gradient(to right, rgba(201,168,76,0.18), rgba(201,168,76,0.02))",
                }}
              />

              <button
                type="button"
                onClick={() => setSelectedService(service)}
                style={{
                  background: `linear-gradient(135deg, rgba(201,168,76,0.98) 0%, rgba(216,186,92,0.98) 48%, rgba(201,168,76,0.98) 100%)`,
                  color: "#0A0905",
                  border: "1px solid rgba(201,168,76,0.44)",
                  borderRadius: "2px",
                  padding: "13px 22px",
                  fontFamily: "'Jost', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.76rem",
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  width: "100%",
                  boxShadow: "0 10px 26px rgba(201,168,76,0.26)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 16px 34px rgba(201,168,76,0.38)";
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.7)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 10px 26px rgba(201,168,76,0.26)";
                  e.currentTarget.style.borderColor = "rgba(201,168,76,0.44)";
                }}
              >
                <span
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "999px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(10,9,5,0.12)",
                    flexShrink: 0,
                  }}
                >
                  <Play size={10} fill="#0A0905" strokeWidth={1.4} />
                </span>
                <span>Watch Demo</span>
              </button>
            </motion.div>
          ))}

          {/* CTA Tile */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: services.length * 0.07 }}
            className="flex flex-col items-center justify-center px-8 py-12 min-h-[390px] relative"
            style={{
              background: "linear-gradient(135deg, rgba(255,254,245,0.96) 0%, rgba(201,168,76,0.12) 100%)",
              backdropFilter: "blur(14px)",
              border: "1px solid rgba(201,168,76,0.24)",
              boxShadow: "0 22px 50px rgba(26,24,20,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
              <span style={{ display: "inline-block", width: "32px", height: "1px", background: "linear-gradient(to right, transparent, #C9A84C)" }} />
              <span style={{ color: "#C9A84C", fontSize: "0.48rem" }}>◆</span>
              <span style={{ display: "inline-block", width: "32px", height: "1px", background: "linear-gradient(to left, transparent, #C9A84C)" }} />
            </div>
            <h3
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 600,
                fontSize: "clamp(2rem, 3vw, 2.6rem)",
                color: "#1A1814",
                textAlign: "center",
                marginBottom: "16px",
                letterSpacing: "0.02em",
                lineHeight: 1.15,
              }}
            >
              Ready to Elevate Your Vehicle?
            </h3>
            <p
              style={{
                fontFamily: "'Jost', sans-serif",
                fontWeight: 300,
                fontSize: "1.05rem",
                color: "rgba(90,82,71,0.93)",
                textAlign: "center",
                marginBottom: "28px",
                lineHeight: 1.9,
                maxWidth: "420px",
              }}
            >
              Book a consultation and let our experts craft the perfect package for your vehicle.
            </p>
            <a href="/book">
              <button
                style={{
                  background: "linear-gradient(135deg, #C9A84C 0%, #D4B85A 50%, #C9A84C 100%)",
                  color: "#0A0905",
                  border: "none",
                  borderRadius: "2px",
                  padding: "15px 48px",
                  fontFamily: "'Jost', sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.26em",
                  fontSize: "0.78rem",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.28s ease",
                  boxShadow: "0 10px 26px rgba(201,168,76,0.34)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 14px 34px rgba(201,168,76,0.48)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 10px 26px rgba(201,168,76,0.34)";
                }}
              >
                Book Appointment
              </button>
            </a>
          </motion.div>
        </div>

        {/* Video Dialog */}
        <Dialog open={Boolean(selectedService)} onOpenChange={(isOpen) => !isOpen && setSelectedService(null)}>
          <DialogContent
            className="max-w-3xl p-0 overflow-hidden"
            style={{ background: "#0D0C09", border: "1px solid rgba(201,168,76,0.25)" }}
          >
            {selectedService && (
              <>
                <div className="aspect-video w-full" style={{ background: "#0A0905" }}>
                  {(selectedServiceVideo as any).videoSrc ? (
                    <video src={(selectedServiceVideo as any).videoSrc} controls preload="metadata" className="h-full w-full" />
                  ) : (selectedServiceVideo as any).videoEmbedUrl ? (
                    <iframe
                      src={(selectedServiceVideo as any).videoEmbedUrl}
                      title={`${selectedService.title} video`}
                      className="h-full w-full"
                      loading="lazy"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center">
                      <span style={{ color: "#C9A84C", fontSize: "1.8rem", marginBottom: "12px" }}>▶</span>
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", color: "#FFFEF5" }}>Video coming soon</p>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.82rem", color: "rgba(200,196,182,0.55)", marginTop: "6px" }}>Add video in serviceVideos.ts</p>
                    </div>
                  )}
                </div>
                <DialogHeader className="p-6 pt-5">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <span style={{ width: "24px", height: "1px", background: "rgba(201,168,76,0.5)" }} />
                    <DialogTitle
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "1.55rem",
                        color: "#FFFEF5",
                        WebkitTextFillColor: "#FFFEF5",
                        fontWeight: 500,
                      }}
                    >
                      {selectedService.title}
                    </DialogTitle>
                  </div>
                  <DialogDescription
                    style={{
                      fontFamily: "'Jost', sans-serif",
                      color: "rgba(200,196,182,0.65)",
                      fontSize: "0.9rem",
                      lineHeight: 1.7,
                    }}
                  >
                    {selectedService.description}
                  </DialogDescription>
                </DialogHeader>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
