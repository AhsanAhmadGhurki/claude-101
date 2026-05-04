import { useNavigate } from "react-router-dom";
import { Button } from "antd";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

export function CTA() {
  const navigate = useNavigate();

  return (
    <section className="px-6 pb-24 sm:pb-28 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5 }}
        className="relative rounded-3xl overflow-hidden bg-surface border border-line surface-shadow-lg"
      >
        <div className="grid lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 px-8 py-14 sm:px-14 sm:py-20">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.3em] text-accent mb-5">
              Ready when you are
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-fg leading-tight tracking-tight">
              Your next adventure is{" "}
              <span className="text-accent">one prompt away.</span>
            </h2>
            <p className="mt-5 text-fg-muted text-lg max-w-lg leading-relaxed">
              No accounts, no clutter. Type where you want to go and we'll
              handle the rest.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                type="primary"
                size="large"
                onClick={() => navigate("/builder")}
                icon={<Icon icon="mdi:auto-fix" />}
                className="!h-12 !px-7 !text-base !font-semibold"
              >
                Build my trip
              </Button>
              <Button
                size="large"
                onClick={() => navigate("/explore")}
                className="!h-12 !px-7 !text-base !font-semibold"
              >
                Explore routes
              </Button>
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-5 relative h-full min-h-[420px]">
            <img
              src="https://images.unsplash.com/photo-1502791451862-7bd8c1df43a7?auto=format&fit=crop&w=1400&q=80"
              alt="Adventure ahead"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-surface" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
