import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PageShell } from "./components/layout/PageShell";
import { HomePage } from "./pages/Home";
import { ExplorePage } from "./pages/Explore";
import { TripBuilderPage } from "./pages/TripBuilder";
import { TripDetailsPage } from "./pages/TripDetails";
import { PrivacyPage } from "./pages/info/Privacy";
import { TermsPage } from "./pages/info/Terms";
import { VisaPage } from "./pages/info/Visa";
import { BestTimePage } from "./pages/info/BestTime";
import { PackingPage } from "./pages/info/Packing";
import { SafetyPage } from "./pages/info/Safety";
import "./index.css";

const pageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <PageShell>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<AnimatedPage><HomePage /></AnimatedPage>} />
          <Route path="/explore" element={<AnimatedPage><ExplorePage /></AnimatedPage>} />
          <Route path="/builder" element={<AnimatedPage><TripBuilderPage /></AnimatedPage>} />
          <Route path="/trip/:id" element={<AnimatedPage><TripDetailsPage /></AnimatedPage>} />
          <Route path="/privacy" element={<AnimatedPage><PrivacyPage /></AnimatedPage>} />
          <Route path="/terms" element={<AnimatedPage><TermsPage /></AnimatedPage>} />
          <Route path="/resources/visa" element={<AnimatedPage><VisaPage /></AnimatedPage>} />
          <Route path="/resources/best-time" element={<AnimatedPage><BestTimePage /></AnimatedPage>} />
          <Route path="/resources/packing" element={<AnimatedPage><PackingPage /></AnimatedPage>} />
          <Route path="/resources/safety" element={<AnimatedPage><SafetyPage /></AnimatedPage>} />
        </Routes>
      </AnimatePresence>
    </PageShell>
  );
}

export default App;
