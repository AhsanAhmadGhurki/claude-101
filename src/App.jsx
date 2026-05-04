import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PageShell } from "./components/layout/PageShell";
import { HomePage } from "./pages/Home";
import { ExplorePage } from "./pages/Explore";
import { TripBuilderPage } from "./pages/TripBuilder";
import { TripDetailsPage } from "./pages/TripDetails";
import "./index.css";

const pageVariants = {
  initial: { opacity: 0, y: 60, scale: 0.97, filter: "blur(8px)" },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -40,
    scale: 0.98,
    filter: "blur(6px)",
    transition: { duration: 0.4, ease: [0.4, 0, 1, 1] },
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

  return (
    <PageShell>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<AnimatedPage><HomePage /></AnimatedPage>} />
          <Route path="/explore" element={<AnimatedPage><ExplorePage /></AnimatedPage>} />
          <Route path="/builder" element={<AnimatedPage><TripBuilderPage /></AnimatedPage>} />
          <Route path="/trip/:id" element={<AnimatedPage><TripDetailsPage /></AnimatedPage>} />
        </Routes>
      </AnimatePresence>
    </PageShell>
  );
}

export default App;
