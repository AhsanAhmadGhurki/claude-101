import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PageShell } from "../client/src/components/layout/PageShell";
import { HomePage } from "../client/src/pages/Public/Home";
import { ExplorePage } from "../client/src/pages/Public/Explore";
import { TripBuilderPage } from "../client/src/pages/User/TripBuilder";
import { TripDetailsPage } from "../client/src/pages/User/TripDetails";
import { PrivacyPage } from "../client/src/pages/Public/info/Privacy";
import { TermsPage } from "../client/src/pages/Public/info/Terms";
import { VisaPage } from "../client/src/pages/Public/info/Visa";
import { BestTimePage } from "../client/src/pages/Public/info/BestTime";
import { PackingPage } from "../client/src/pages/Public/info/Packing";
import { SafetyPage } from "../client/src/pages/Public/info/Safety";
import { SignInPage } from "../client/src/pages/Auth/SignInPage";
import { SignUpPage } from "../client/src/pages/Auth/SignUpPage";
import { DashboardPage } from "../client/src/pages/User/DashboardPage";
import { ForgotPasswordPage } from "../client/src/pages/Auth/ForgotPasswordPage";
import { ResetPasswordPage } from "../client/src/pages/Auth/ResetPasswordPage";
import { VerifyEmailPage } from "../client/src/pages/Auth/VerifyEmailPage";
import { ProfilePage } from "../client/src/pages/User/ProfilePage";
import { ProtectedRoute } from "../client/src/components/auth/ProtectedRoute";
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
          <Route path="/signin" element={<AnimatedPage><SignInPage /></AnimatedPage>} />
          <Route path="/signup" element={<AnimatedPage><SignUpPage /></AnimatedPage>} />
          <Route path="/forgot-password" element={<AnimatedPage><ForgotPasswordPage /></AnimatedPage>} />
          <Route path="/reset-password" element={<AnimatedPage><ResetPasswordPage /></AnimatedPage>} />
          <Route path="/verify-email" element={<AnimatedPage><VerifyEmailPage /></AnimatedPage>} />
          <Route
            path="/dashboard"
            element={
              <AnimatedPage>
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              </AnimatedPage>
            }
          />
          <Route
            path="/profile"
            element={
              <AnimatedPage>
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              </AnimatedPage>
            }
          />
        </Routes>
      </AnimatePresence>
    </PageShell>
  );
}

export default App;
