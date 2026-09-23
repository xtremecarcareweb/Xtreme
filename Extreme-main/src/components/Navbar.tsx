import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "About", href: "/#about" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Reviews", href: "/#reviews" },
  { label: "Contact", href: "/#contact" },
  { label: "Admin", href: "/admin" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname !== "/" || !location.hash) return;

    const targetId = location.hash.slice(1);
    const scrollToTarget = () => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
    const frameId = window.requestAnimationFrame(scrollToTarget);

    return () => window.cancelAnimationFrame(frameId);
  }, [location.hash, location.pathname]);

  const handleNavClick = (href: string) => {
    setOpen(false);
    if (href.startsWith("/#")) {
      const id = href.slice(2);
      if (location.pathname === "/") {
        navigate({ pathname: "/", hash: `#${id}` });
      } else {
        navigate({ pathname: "/", hash: `#${id}` });
      }
      return;
    }
    if (href.startsWith("/")) {
      navigate(href);
    }
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(255, 254, 245, 0.96)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #E8E0D0",
      }}
    >
      <div className="flex items-center justify-between w-full py-3 px-6">
        {/* Desktop nav */}
        <div className="ml-auto hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link.href)}
              style={{
                fontFamily: "'Jost', sans-serif",
                fontWeight: 500,
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#6B6357",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#1A1814")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#6B6357")}
            >
              {link.label}
            </button>
          ))}
          <Link to="/book">
            <button
              style={{
                background: "#1A1814",
                color: "#FFFEF5",
                border: "none",
                borderRadius: "3px",
                padding: "8px 20px",
                fontFamily: "'Jost', sans-serif",
                fontWeight: 600,
                letterSpacing: "0.1em",
                fontSize: "0.72rem",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#C9A84C")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#1A1814")}
            >
              Book Now
            </button>
          </Link>
          <a href="tel:+919884149111">
            <button
              style={{
                background: "transparent",
                color: "#1A1814",
                border: "1px solid #1A1814",
                borderRadius: "3px",
                padding: "7px 16px",
                fontFamily: "'Jost', sans-serif",
                fontWeight: 600,
                letterSpacing: "0.08em",
                fontSize: "0.72rem",
                textTransform: "uppercase",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "background 0.2s, color 0.2s",
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = "#1A1814"; e.currentTarget.style.color = "#FFFEF5"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#1A1814"; }}
            >
              <Phone style={{ width: "13px", height: "13px" }} /> Call
            </button>
          </a>
        </div>

        {/* Hamburger */}
        <button
          className="lg:hidden"
          onClick={() => setOpen(!open)}
          style={{ color: "#1A1814", background: "none", border: "none", cursor: "pointer" }}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          style={{
            background: "#FFFEF5",
            borderBottom: "1px solid #E8E0D0",
          }}
        >
          <div className="luxury-gradient-line mb-2" />
          <div className="flex flex-col gap-3 w-full py-4 px-6">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                style={{
                  fontFamily: "'Jost', sans-serif",
                  fontWeight: 500,
                  fontSize: "0.8rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#6B6357",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  padding: "8px 0",
                }}
              >
                {link.label}
              </button>
            ))}
            <Link to="/book" onClick={() => setOpen(false)}>
              <button
                style={{
                  width: "100%",
                  background: "#1A1814",
                  color: "#FFFEF5",
                  border: "none",
                  borderRadius: "3px",
                  padding: "12px",
                  fontFamily: "'Jost', sans-serif",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  fontSize: "0.78rem",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  marginTop: "6px",
                }}
              >
                Book Now
              </button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
