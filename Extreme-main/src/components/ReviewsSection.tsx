import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Virtus GT Owner",
    rating: 5,
    text: "Got PPF done for my Virtus GT at Xtreme Car Care, and I’m really happy with the experience. The team was professional, explained everything clearly, and the quality of the work is excellent. The finish looks perfect and they took great care of the car. They were very transparent throughout the process and kept me updated at each stage of their work. Would definitely recommend them to anyone looking for PPF or detailing work!",
    service: "PPF",
  },
  {
    name: "Venue Owner",
    rating: 5,
    text: "Sharing my experience with Xtreme car care services ❤️\nI have a 4 year old Hyundai Venue iMT 🚙 and was looking for a normal interior and exterior along with some repaint services.\nThis place was a suggestion from my friend and we had an initial analysis on how it can be done.\nMr.Srini(owner of the place) was kind to clearly explain and clarify details about the overall paint services and suggested for a nano coating and a complete interior for the car.\nI was totally impressed with the services, after-care suggestions and the price range quoted for the complete work. Even though there was a tight timeline, their delivery was on-time.\nIn case you are on a lookout for suggestion, guidance and car detailing works, no second thoughts, please have a visit to experience",
    service: "Interior & Exterior",
  },
  { name: "Arun S.", rating: 5, text: "Fantastic detailing and premium service. They installed a 360° camera and it works flawlessly.", service: "360° Camera" },
  { name: "Rajesh K.", rating: 5, text: "Excellent car wash service and great coordination. My car looks brand new after the ceramic coating!", service: "Ceramic Coating" },
  { name: "Vikram P.", rating: 5, text: "World-class service at affordable rates. The Android system they installed works perfectly.", service: "Android System" },
  { name: "Sneha V.", rating: 4, text: "Very professional team. They took great care of my BMW. Highly recommend their polishing service.", service: "Car Polishing" },
];

export default function ReviewsSection() {
  return (
    <section id="reviews" className="py-24" style={{ background: "transparent" }}>
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="text-center mb-14">
          <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 500, fontSize: "0.72rem", letterSpacing: "0.28em", textTransform: "uppercase", color: "#C9A84C", marginBottom: "10px" }}>
            Testimonials
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 600, fontSize: "clamp(2rem, 4vw, 3rem)", color: "#1A1814", WebkitTextFillColor: "#1A1814" }}>
            What Our <span style={{ color: "#C9A84C", WebkitTextFillColor: "#C9A84C" }}>Customers</span> Say
          </h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "14px" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              {[...Array(5)].map((_, i) => <Star key={i} style={{ width: "16px", height: "16px", fill: "#C9A84C", color: "#C9A84C" }} />)}
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: "1.1rem", color: "#1A1814" }}>4.8</span>
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.8rem", color: "#6B6357" }}>(341 reviews)</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "#E8E0D0" }}>
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              style={{ background: "#FFFFFF", padding: "28px", transition: "background 0.2s" }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#FFFEF5")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#FFFFFF")}
            >
              <div style={{ display: "flex", gap: "3px", marginBottom: "14px" }}>
                {[...Array(review.rating)].map((_, j) => <Star key={j} style={{ width: "14px", height: "14px", fill: "#C9A84C", color: "#C9A84C" }} />)}
                {[...Array(5 - review.rating)].map((_, j) => <Star key={j} style={{ width: "14px", height: "14px", color: "#E8E0D0" }} />)}
              </div>
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400, fontSize: "0.88rem", color: "#3D3830", lineHeight: 1.75, marginBottom: "16px" }}>
                "{review.text}"
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: "1rem", color: "#1A1814", WebkitTextFillColor: "#1A1814" }}>
                    {review.name}
                  </p>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.72rem", color: "#C9A84C", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "2px" }}>
                    {review.service}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
