import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PageShell } from "./components/layout/PageShell";
import { HomePage } from "./pages/Public/Home";
import { ExplorePage } from "./pages/Public/Explore";
import { PrivacyPage } from "./pages/Public/info/Privacy";
import { TermsPage } from "./pages/Public/info/Terms";
import { VisaPage } from "./pages/Public/info/Visa";
import { BestTimePage } from "./pages/Public/info/BestTime";
import { PackingPage } from "./pages/Public/info/Packing";
import { SafetyPage } from "./pages/Public/info/Safety";
import { SignInPage } from "./pages/Auth/SignInPage";
import { SignUpPage } from "./pages/Auth/SignUpPage";
import { ForgotPasswordPage } from "./pages/Auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/Auth/ResetPasswordPage";
import { VerifyEmailPage } from "./pages/Auth/VerifyEmailPage";
import { ProfilePage } from "./pages/User/ProfilePage";
import { SavedTripsPage } from "./pages/User/SavedTrips";
import { NotFoundPage } from "./pages/Public/NotFound";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RedirectIfAuthed } from "./components/auth/RedirectIfAuthed";
import { PageLoader } from "./components/ui/PageLoader";
import "./index.css";

// The three heaviest pages are split into their own chunks so the user
// gets an immediate centered spinner via Suspense while the chunk loads,
// instead of staring at a blank screen for several seconds on slow
// connections.
const TripBuilderPage = lazy(() =>
  import("./pages/User/TripBuilder").then((m) => ({ default: m.TripBuilderPage }))
);
const TripDetailsPage = lazy(() =>
  import("./pages/User/TripDetails").then((m) => ({ default: m.TripDetailsPage }))
);
const DashboardPage = lazy(() =>
  import("./pages/User/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);

// Initial opacity is 0.01 (not 0) so a slow lazy-route chunk-load never
// leaves the viewport fully black — the previous page is gone, the new
// page is mounting, and even ~80ms of `opacity:0` reads as a flash to the
// user. 0.01 is functionally invisible but skips the "is the app broken?"
// perception.
const pageVariants = {
  initial: { opacity: 0.01, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0.01,
    y: -4,
    transition: { duration: 0.12, ease: "easeIn" },
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
          <Route
            path="/builder"
            element={
              <AnimatedPage>
                <Suspense fallback={<PageLoader label="Loading planner…" />}>
                  <TripBuilderPage />
                </Suspense>
              </AnimatedPage>
            }
          />
          <Route
            path="/trip/:id"
            element={
              <AnimatedPage>
                <Suspense fallback={<PageLoader label="Loading trip…" />}>
                  <TripDetailsPage />
                </Suspense>
              </AnimatedPage>
            }
          />
          {/* Public share link — no auth required. Renders the same
              page in share mode (Save/Edit hidden, fetched via the
              public /api/trips/share endpoint). */}
          <Route
            path="/trip/share/:id"
            element={
              <AnimatedPage>
                <Suspense fallback={<PageLoader label="Loading trip…" />}>
                  <TripDetailsPage mode="share" />
                </Suspense>
              </AnimatedPage>
            }
          />
          <Route path="/privacy" element={<AnimatedPage><PrivacyPage /></AnimatedPage>} />
          <Route path="/terms" element={<AnimatedPage><TermsPage /></AnimatedPage>} />
          <Route path="/resources/visa" element={<AnimatedPage><VisaPage /></AnimatedPage>} />
          <Route path="/resources/best-time" element={<AnimatedPage><BestTimePage /></AnimatedPage>} />
          <Route path="/resources/packing" element={<AnimatedPage><PackingPage /></AnimatedPage>} />
          <Route path="/resources/safety" element={<AnimatedPage><SafetyPage /></AnimatedPage>} />
          {/* Common alias — some auth flows / inbound links use /login. */}
          <Route path="/login" element={<Navigate to="/signin" replace />} />
          <Route path="/signin" element={<AnimatedPage><RedirectIfAuthed><SignInPage /></RedirectIfAuthed></AnimatedPage>} />
          <Route path="/signup" element={<AnimatedPage><RedirectIfAuthed><SignUpPage /></RedirectIfAuthed></AnimatedPage>} />
          {/* /forgot-password stays reachable even when authenticated — users
              must be able to click "Forgot password?" without the auth guard
              bouncing them to /dashboard. */}
          <Route path="/forgot-password" element={<AnimatedPage><ForgotPasswordPage /></AnimatedPage>} />
          <Route path="/reset-password" element={<AnimatedPage><RedirectIfAuthed><ResetPasswordPage /></RedirectIfAuthed></AnimatedPage>} />
          <Route path="/verify-email" element={<AnimatedPage><VerifyEmailPage /></AnimatedPage>} />
          <Route
            path="/dashboard"
            element={
              <AnimatedPage>
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader label="Loading dashboard…" />}>
                    <DashboardPage />
                  </Suspense>
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
          {/* Catch-all 404 — must stay last so it doesn't shadow real routes. */}
          <Route path="*" element={<AnimatedPage><NotFoundPage /></AnimatedPage>} />
        </Routes>
      </AnimatePresence>
    </PageShell>
  );
}

export default App;
