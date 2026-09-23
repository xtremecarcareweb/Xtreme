import { MessageCircle, Phone } from "lucide-react";

export default function WhatsAppButton() {
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2.5 sm:gap-3">
      <a
        href="tel:+919884149111"
        className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full shadow-lg hover:scale-110 transition-transform duration-300 animate-pulse-gold"
        style={{
          background: '#C9A84C',
          color: '#FFFFFF',
          boxShadow: '0 4px 14px rgba(201,168,76,0.35)',
        }}
        aria-label="Call Now"
      >
        <Phone className="h-5 w-5 sm:h-6 sm:w-6" />
      </a>
      <a
        href="https://wa.me/919884149111?text=Hi%2C%20I%27d%20like%20to%20book%20an%20appointment%20at%20Xtreme%20Car%20Care"
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[hsl(142,70%,45%)] text-foreground shadow-lg hover:scale-110 transition-transform duration-300"
        aria-label="WhatsApp"
      >
        <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
      </a>
    </div>
  );
}
