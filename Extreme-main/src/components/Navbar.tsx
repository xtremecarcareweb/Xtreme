import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpeg";

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

    const id = location.hash.slice(1);
    window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    });
  }, [location.hash, location.pathname]);

  const handleNavClick = (href: string) => {
    setOpen(false);
    if (href.startsWith("/#")) {
      const id = href.slice(2);
      if (location.pathname === "/") {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate(href);
      }
      return;
    }

    if (href.startsWith("/")) {
      navigate(href);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="flex items-center justify-between w-full py-3">
        <div className="flex items-center gap-3 min-w-[180px]">{/* Placeholder to preserve navbar spacing */}</div>

        <div className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link.href)}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </button>
          ))}
          <Link to="/book">
            <Button variant="gold" size="sm">Book Now</Button>
          </Link>
          <a href="tel:+919884149111">
            <Button variant="gold-outline" size="sm">
              <Phone className="h-4 w-4" /> Call
            </Button>
          </a>
        </div>

        <button className="lg:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="glass lg:hidden">
          <div className="luxury-gradient-line mb-2" />
          <div className="flex flex-col gap-3 w-full py-4 px-2">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className="text-left text-sm font-medium text-muted-foreground transition-colors hover:text-primary py-2"
              >
                {link.label}
              </button>
            ))}
            <Link to="/book" onClick={() => setOpen(false)}>
              <Button variant="gold" className="w-full">Book Now</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
