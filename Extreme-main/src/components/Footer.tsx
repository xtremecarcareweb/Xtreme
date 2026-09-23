import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import logo from "@/assets/logo.jpeg";

export default function Footer() {
  return (
    <footer style={{ background: "#1A1814", paddingTop: "60px", paddingBottom: "40px" }}>
      <div style={{ width: "60%", height: "1px", background: "rgba(255,254,245,0.12)", margin: "0 auto 48px" }} />
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <img src={logo} alt="Xtreme Car Care" style={{ height: "36px", width: "36px", borderRadius: "3px", objectFit: "cover" }} />
              <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 700, fontSize: "1rem", color: "#C9A84C", letterSpacing: "0.06em" }}>
                XTREME CAR CARE
              </span>
            </div>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: "0.85rem", color: "#8A8278", lineHeight: 1.7 }}>
              Chennai's premium car detailing and restoration studio. Precision care for your prized possession.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: "1.05rem", color: "#FFFEF5", WebkitTextFillColor: "#FFFEF5", marginBottom: "16px", letterSpacing: "0.04em" }}>
              Quick Links
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {["Services", "About", "Gallery", "Reviews", "Contact"].map((item) => (
                <a
                  key={item}
                  href={`/#${item.toLowerCase()}`}
                  style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.82rem", color: "#8A8278", textDecoration: "none", letterSpacing: "0.04em", transition: "color 0.2s" }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#C9A84C")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#8A8278")}
                >
                  {item}
                </a>
              ))}
              <Link
                to="/book"
                style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.82rem", color: "#8A8278", textDecoration: "none", letterSpacing: "0.04em" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#C9A84C")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#8A8278")}
              >
                Book Appointment
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: "1.05rem", color: "#FFFEF5", WebkitTextFillColor: "#FFFEF5", marginBottom: "16px", letterSpacing: "0.04em" }}>
              Contact
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {["6, Arcot Rd, Virugambakkam", "Chennai, Tamil Nadu 600092"].map((line) => (
                <p key={line} style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.82rem", color: "#8A8278" }}>{line}</p>
              ))}
              <a href="tel:+919884149111" style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.82rem", color: "#8A8278", textDecoration: "none", transition: "color 0.2s" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#C9A84C")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#8A8278")}>
                +91 98841 49111
              </a>
              <a
                href="https://www.instagram.com/xtremecarcarechennai?igsh=MW01YWw4OWx3bXNteg=="
                target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.82rem", color: "#8A8278", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px", transition: "color 0.2s" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#C9A84C")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#8A8278")}
              >
                <Instagram style={{ width: "14px", height: "14px" }} />
                @xtremecarcarechennai
              </a>
            </div>
          </div>
        </div>

        <div style={{ width: "100%", height: "1px", background: "rgba(255,254,245,0.08)", margin: "40px 0 24px" }} />
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.75rem", color: "#5C5650", textAlign: "center", letterSpacing: "0.06em" }}>
          © {new Date().getFullYear()} Xtreme Car Care. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
