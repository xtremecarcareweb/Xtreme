import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.jpeg";

const heroImage = "/images/hero-slider/hero.jpeg";

export default function HeroSection() {
  return (
    <section
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden pt-8 md:pt-16"
      style={{
        background: `linear-gradient(180deg, rgba(8,7,5,0.56) 0%, rgba(8,7,5,0.72) 45%, rgba(8,7,5,0.96) 100%), url(${heroImage}) center center / cover no-repeat`,
        width: "100%",
        minHeight: "100vh",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Left gold accent line */}
      <motion.div
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
        className="hero-side-line hero-side-line-left absolute left-8 md:left-16 top-1/2 -translate-y-1/2 block"
        style={{
          width: "1px",
          height: "160px",
          background: "linear-gradient(to bottom, transparent, #C9A84C, transparent)",
          transformOrigin: "top",
        }}
      />
      <motion.div
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 1.2, ease: "easeOut" }}
        className="hero-side-line hero-side-line-right absolute right-8 md:right-16 top-1/2 -translate-y-1/2 block"
        style={{
          width: "1px",
          height: "160px",
          background: "linear-gradient(to bottom, transparent, #C9A84C, transparent)",
          transformOrigin: "top",
        }}
      />

      <div
        className="hero-content relative z-10 w-full text-center flex flex-col items-center justify-center px-4"
        style={{ left: 0, right: 0, position: "relative" }}
      >
        {/* Logo + Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          className="hero-logo-row mb-3 mt-1 md:mt-[-2.1rem] flex items-center gap-3 justify-center"
        >
          <img
            src={logo}
            alt="Logo"
            style={{
              height: "3rem",
              width: "3rem",
              minWidth: "3rem",
              minHeight: "3rem",
              objectFit: "cover",
              borderRadius: "0.35em",
              boxShadow: "0 0 0 1px rgba(201,168,76,0.4), 0 2px 12px rgba(0,0,0,0.4)",
            }}
          />
          <span
            className="hero-brand-name"
            style={{
              display: "inline-block",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(1.1rem, 2.2vw, 1.55rem)",
              fontWeight: 600,
              letterSpacing: "0.2em",
              background: "linear-gradient(130deg, #E8C96A 0%, #C9A84C 35%, #F5DC85 65%, #C9A84C 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 3px 16px rgba(201,168,76,0.5))",
            }}
          >
            XTREME CAR CARE
          </span>
        </motion.div>

        {/* Ornamental divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.35, duration: 0.9, ease: "easeOut" }}
          className="hero-top-ornament flex"
          style={{ alignItems: "center", gap: "10px", margin: "0.5rem auto 1.6rem" }}
        >
          <span style={{ display: "inline-block", width: "48px", height: "1px", background: "linear-gradient(to right, transparent, #C9A84C)" }} />
          <span style={{ color: "#C9A84C", fontSize: "0.48rem" }}>◆</span>
          <span style={{ display: "inline-block", width: "48px", height: "1px", background: "linear-gradient(to left, transparent, #C9A84C)" }} />
        </motion.div>

        {/* Main headline — large, bold, clearly visible */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.9 }}
          className="hero-heading mb-5"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 300,
            lineHeight: 1.06,
            letterSpacing: "0.01em",
            textAlign: "center",
          }}
        >
          <span
            style={{
              display: "block",
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
              background: "none",
              fontWeight: 300,
              lineHeight: 1.05,
              fontSize: "clamp(2.4rem, 6vw, 5rem)",
              textShadow: "0 2px 40px rgba(0,0,0,0.9), 0 4px 80px rgba(0,0,0,0.6)",
            }}
          >
            Elevate Your
          </span>
          <span
            style={{
              display: "block",
              background: "linear-gradient(130deg, #E8C96A 0%, #C9A84C 35%, #F5DC85 65%, #C9A84C 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: 600,
              letterSpacing: "0.02em",
              fontSize: "clamp(2.4rem, 6vw, 5rem)",
              filter: "drop-shadow(0 3px 16px rgba(201,168,76,0.5))",
            }}
          >
            Driving Experience
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.8 }}
          className="hero-subheading mb-4 w-full px-2"
          style={{
            fontFamily: "'Jost', sans-serif",
            fontWeight: 400,
            fontSize: "clamp(0.62rem, 1.35vw, 0.9rem)",
            color: "rgba(255,254,245,0.95)",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            textAlign: "center",
            textShadow: "0 1px 10px rgba(0,0,0,0.7)",
          }}
        >
          <span className="hidden sm:flex flex-row flex-nowrap justify-center items-center gap-3 w-full whitespace-nowrap">
            <span>Luxury Detailing</span>
            <span style={{ color: "#C9A84C", fontSize: "0.58rem" }}>◆</span>
            <span>Paint Protection</span>
            <span style={{ color: "#C9A84C", fontSize: "0.58rem" }}>◆</span>
            <span>Custom Interiors</span>
          </span>
          <span className="flex sm:hidden flex-col items-center gap-1.5 leading-tight">
            <span className="whitespace-nowrap">Luxury Detailing <span style={{ color: "#C9A84C", fontSize: "0.52rem" }}>◆</span> Paint Protection</span>
            <span className="whitespace-nowrap">Custom Interiors</span>
          </span>
        </motion.div>

        {/* Supporting tagline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.8 }}
          className="mb-10 mt-1"
        >
          <span
            style={{
              display: "block",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "clamp(1rem, 1.8vw, 1.25rem)",
              color: "rgba(240,235,224,0.85)",
              letterSpacing: "0.12em",
              textShadow: "0 1px 12px rgba(0,0,0,0.6)",
            }}
          >
            Precision. Protection. Perfection.
          </span>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.8 }}
          className="hero-cta-group flex justify-center gap-4 mb-14 mt-2 flex-wrap"
        >
          <Link to="/book">
            <button
              className="hero-cta-primary"
              style={{
                background: "linear-gradient(135deg, #C9A84C 0%, #D4B85A 50%, #C9A84C 100%)",
                color: "#0A0905",
                border: "none",
                borderRadius: "2px",
                padding: "15px 52px",
                fontFamily: "'Jost', sans-serif",
                fontWeight: 700,
                letterSpacing: "0.22em",
                fontSize: "0.74rem",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.28s ease",
                boxShadow: "0 4px 24px rgba(201,168,76,0.4)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(201,168,76,0.55)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(201,168,76,0.4)";
              }}
            >
              Book Appointment
            </button>
          </Link>
          <a href="#services">
            <button
              className="hero-cta-secondary"
              style={{
                background: "transparent",
                color: "rgba(255,254,245,0.92)",
                border: "1px solid rgba(255,254,245,0.45)",
                borderRadius: "2px",
                padding: "15px 44px",
                fontFamily: "'Jost', sans-serif",
                fontWeight: 500,
                letterSpacing: "0.22em",
                fontSize: "0.74rem",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.28s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "#C9A84C";
                e.currentTarget.style.color = "#C9A84C";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,254,245,0.45)";
                e.currentTarget.style.color = "rgba(255,254,245,0.92)";
              }}
            >
              Our Services
            </button>
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.8 }}
          className="hero-stats mt-2 flex flex-row flex-wrap items-center justify-center gap-x-2 sm:gap-x-6 w-full px-2"
        >
          <div
            className="flex flex-row items-center justify-center w-full max-w-xl"
            style={{
              background: "rgba(10,9,5,0.5)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "2px",
              padding: "12px 22px",
            }}
          >
            {[
              { value: "4.8★", label: "Google Rating" },
              { value: "1000+", label: "Cars Transformed" },
              { value: "1M+", label: "Happy Clients" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-row items-center flex-1">
                <div className="hero-stat flex-1 text-center px-4 min-w-[90px] sm:min-w-[110px]">
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: "clamp(1.5rem, 3vw, 2.8rem)",
                      fontWeight: 600,
                      background: "linear-gradient(130deg, #E8C96A, #C9A84C, #F5DC85)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {stat.value}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Jost', sans-serif",
                      fontSize: "0.68rem",
                      color: "rgba(226,222,207,0.72)",
                      marginTop: "2px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                    }}
                  >
                    {stat.label}
                  </p>
                </div>
                {i < 2 && (
                  <div className="h-8 w-px mx-2 md:mx-4 block" style={{ background: "rgba(201,168,76,0.22)" }} />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom tagline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-8 flex justify-center"
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: "italic",
              fontWeight: 400,
              fontSize: "0.95rem",
              color: "rgba(201,168,76,0.72)",
              letterSpacing: "0.1em",
            }}
          >
            <span style={{ display: "inline-block", width: "36px", height: "1px", background: "linear-gradient(to right, transparent, #C9A84C)" }} />
            Over 1 Million Journeys Elevated
            <span style={{ display: "inline-block", width: "36px", height: "1px", background: "linear-gradient(to left, transparent, #C9A84C)" }} />
          </span>
        </motion.div>
      </div>

      {/* Bottom cinematic fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(255,254,245,0.10), transparent)" }} />

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 cursor-pointer"
        onClick={() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })}
      >
        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.58rem", letterSpacing: "0.24em", color: "rgba(255,254,245,0.4)", textTransform: "uppercase" }}>Scroll</span>
        <motion.div
          animate={{ y: [0, 7, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          style={{ width: "1px", height: "28px", background: "linear-gradient(to bottom, rgba(201,168,76,0.65), transparent)" }}
        />
      </motion.div>
    </section>
  );
}
