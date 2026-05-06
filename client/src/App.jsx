import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PageShell } from "./components/layout/PageShell";
import { HomePage } from "./pages/Public/Home";
import { ExplorePage } from "./pages/Public/Explore";
import { TripBuilderPage } from "./pages/User/TripBuilder";
import { TripDetailsPage } from "./pages/User/TripDetails";
import { PrivacyPage } from "./pages/Public/info/Privacy";
import { TermsPage } from "./pages/Public/info/Terms";
import { VisaPage } from "./pages/Public/info/Visa";
import { BestTimePage } from "./pages/Public/info/BestTime";
import { PackingPage } from "./pages/Public/info/Packing";
import { SafetyPage } from "./pages/Public/info/Safety";
import { SignInPage } from "./pages/Auth/SignInPage";
import { SignUpPage } from "./pages/Auth/SignUpPage";
import { LoginOtpPage } from "./pages/Auth/LoginOtpPage";
import { DashboardPage } from "./pages/User/DashboardPage";
import { ForgotPasswordPage } from "./pages/Auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/Auth/ResetPasswordPage";
import { VerifyEmailPage } from "./pages/Auth/VerifyEmailPage";
import { ProfilePage } from "./pages/User/ProfilePage";
import { SavedTripsPage } from "./pages/User/SavedTrips";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RedirectIfAuthed } from "./components/auth/RedirectIfAuthed";
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
          <Route path="/signin" element={<AnimatedPage><RedirectIfAuthed><SignInPage /></RedirectIfAuthed></AnimatedPage>} />
          <Route path="/signup" element={<AnimatedPage><RedirectIfAuthed><SignUpPage /></RedirectIfAuthed></AnimatedPage>} />
          <Route path="/login-otp" element={<AnimatedPage><RedirectIfAuthed><LoginOtpPage /></RedirectIfAuthed></AnimatedPage>} />
          <Route path="/forgot-password" element={<AnimatedPage><RedirectIfAuthed><ForgotPasswordPage /></RedirectIfAuthed></AnimatedPage>} />
          <Route path="/reset-password" element={<AnimatedPage><RedirectIfAuthed><ResetPasswordPage /></RedirectIfAuthed></AnimatedPage>} />
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
          <Route
            path="/saved-trips"
            element={
              <AnimatedPage>
                <ProtectedRoute>
                  <SavedTripsPage />
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
