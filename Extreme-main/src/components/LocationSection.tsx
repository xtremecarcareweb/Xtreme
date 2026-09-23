import { motion } from "framer-motion";
import { MapPin, Phone, Clock, Navigation, ExternalLink } from "lucide-react";

export default function LocationSection() {
  return (
    <section id="contact" className="py-24" style={{ background: "transparent" }}>
      <div className="w-full px-6 md:px-12 lg:px-20">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center mb-14">
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: "0.72rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "#C9A84C", marginBottom: "10px" }}>
            Find Us
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#1A1814", WebkitTextFillColor: "#1A1814" }}>
            Visit <span style={{ color: "#C9A84C", WebkitTextFillColor: "#C9A84C" }}>Our Studio</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            style={{ borderRadius: "4px", overflow: "hidden", height: "400px", border: "1px solid #E8E0D0" }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.64321685458!2d80.1912!3d13.0583!2m3!1f0!2f0!3f0!3m2!1i1024!2i710!4f13.1!3m3!1m2!1s0x3a5267b8d0e212f3%3A0xed4082416c885957!2sXtreme%20Car%20Care!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Xtreme Car Care Location"
            />
          </motion.div>

          {/* Contact Info */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="flex flex-col gap-4">
            {[
              { icon: MapPin, title: "Address", content: "6, Arcot Rd, Ayyavupuram, Virugambakkam,\nChennai, Tamil Nadu 600092, India" },
              { icon: Phone, title: "Phone", content: "+91 98841 49111", href: "tel:+919884149111" },
              { icon: Clock, title: "Working Hours", content: "Monday – Sunday\n9:00 AM – 11:00 PM" },
            ].map(({ icon: Icon, title, content, href }) => (
              <div key={title} style={{ background: "#FFFFFF", border: "1px solid #E8E0D0", borderRadius: "4px", padding: "20px 24px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <Icon style={{ width: "18px", height: "18px", color: "#C9A84C", marginTop: "2px", flexShrink: 0 }} />
                <div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: "1rem", color: "#1A1814", WebkitTextFillColor: "#1A1814", marginBottom: "4px" }}>{title}</h3>
                  {href ? (
                    <a href={href} style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.88rem", color: "#6B6357", textDecoration: "none" }}>{content}</a>
                  ) : (
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.88rem", color: "#6B6357", lineHeight: 1.6, whiteSpace: "pre-line" }}>{content}</p>
                  )}
                </div>
              </div>
            ))}

            <div style={{ display: "flex", flexDirection: "row", gap: "10px", flexWrap: "wrap" }}>
              {[
                { label: "Get Directions", icon: Navigation, href: "https://maps.app.goo.gl/LEa278WZReNaS6tD7", primary: true },
                { label: "Call Now", icon: Phone, href: "tel:+919884149111", primary: false },
                { label: "Instagram", icon: ExternalLink, href: "https://www.instagram.com/xtremecarcarechennai", primary: false },
              ].map(({ label, icon: Icon, href, primary }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{ flex: "1", minWidth: "120px" }}>
                  <button style={{
                    width: "100%",
                    background: primary ? "#1A1814" : "transparent",
                    color: primary ? "#FFFEF5" : "#1A1814",
                    border: `1px solid #1A1814`,
                    borderRadius: "3px",
                    padding: "11px 16px",
                    fontFamily: "'Jost', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.72rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    transition: "background 0.2s, color 0.2s",
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "#C9A84C"; e.currentTarget.style.color = "#FFFFFF"; e.currentTarget.style.borderColor = "#C9A84C"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = primary ? "#1A1814" : "transparent"; e.currentTarget.style.color = primary ? "#FFFEF5" : "#1A1814"; e.currentTarget.style.borderColor = "#1A1814"; }}
                  >
                    <Icon style={{ width: "13px", height: "13px" }} /> {label}
                  </button>
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
