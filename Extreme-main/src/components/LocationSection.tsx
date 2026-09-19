import { motion } from "framer-motion";
import { MapPin, Navigation, Phone, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LocationSection() {
  return (
    <section id="contact" className="py-24 bg-surface">
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-primary font-heading text-sm tracking-[0.3em] uppercase mb-3">Find Us</p>
          <h2 className="font-heading text-3xl md:text-5xl font-bold">
            Visit <span className="text-gradient-gold">Our Studio</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-xl overflow-hidden h-[400px] border border-border"
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.64321685458!2d80.1912!3d13.0583!2m3!1f0!2f0!3f0!3m2!1i1024!2i710!4f13.1!3m3!1m2!1s0x3a5267b8d0e212f3%3A0xed4082416c885957!2sXtreme%20Car%20Care!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Xtreme Car Care Location"
            />
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-6"
          >
            <div className="glass rounded-xl p-6">
              <div className="flex items-start gap-4">
                <MapPin className="h-6 w-6 text-primary mt-1 shrink-0" />
                <div>
                  <h3 className="font-heading font-bold mb-1">Address</h3>
                  <p className="text-muted-foreground text-sm">
                    6, Arcot Rd, Ayyavupuram, Virugambakkam,<br />
                    Chennai, Tamil Nadu 600092, India
                  </p>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Phone className="h-6 w-6 text-primary mt-1 shrink-0" />
                <div>
                  <h3 className="font-heading font-bold mb-1">Phone</h3>
                  <a href="tel:+919884149111" className="text-muted-foreground text-sm hover:text-primary transition-colors">
                    +91 98841 49111
                  </a>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Clock className="h-6 w-6 text-primary mt-1 shrink-0" />
                <div>
                  <h3 className="font-heading font-bold mb-1">Working Hours</h3>
                  <p className="text-muted-foreground text-sm">Monday – Sunday</p>
                  <p className="text-muted-foreground text-sm">9:00 AM – 11:00 PM</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://maps.app.goo.gl/LEa278WZReNaS6tD7"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="gold" className="w-full">
                  <Navigation className="h-4 w-4" /> Get Directions
                </Button>
              </a>
              <a href="tel:+919884149111" className="flex-1">
                <Button variant="gold-outline" className="w-full">
                  <Phone className="h-4 w-4" /> Call Now
                </Button>
              </a>
              <a
                href="https://www.instagram.com/xtremecarcarechennai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button variant="gold-outline" className="w-full">
                  <ExternalLink className="h-4 w-4" /> Instagram
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
