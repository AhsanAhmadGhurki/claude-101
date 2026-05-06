import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError, setAuthFailureHandler } from "../../api/client";
import { AuthContext } from "./authContext";

// One-time cleanup of the legacy localStorage token from the v1 system.
// Cookie auth replaces it; without this, dev environments that ran v1
// keep a stale value that nothing reads.
const LEGACY_KEY = "adventure.auth.token";
if (typeof window !== "undefined" && localStorage.getItem(LEGACY_KEY)) {
  localStorage.removeItem(LEGACY_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { user } = await api.me();
        if (!cancelled) setUser(user);
      } catch (err) {
        // 401 here just means "no valid session" — fine, user is anonymous.
        if (!(err instanceof ApiError && err.status === 401)) {
          console.error("Failed to load session:", err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // The api client tells us when refresh has failed → fully sign the user out.
  useEffect(() => {
    setAuthFailureHandler(() => setUser(null));
    return () => setAuthFailureHandler(null);
  }, []);

  // signin is now a two-step flow. Step 1 verifies creds and triggers an
  // email OTP; the response carries { pendingOtp: true, email } and NO
  // session cookies. The caller is expected to navigate to the OTP page
  // and call verifyLoginOtp with the code from the user's email.
  //
  // For dev convenience, response.devOtp (only present in non-prod) is
  // forwarded so the OTP page can display it as a hint.
  const signin = useCallback(async (credentials) => {
    const result = await api.signin(credentials);
    if (result?.pendingOtp) {
      return {
        pendingOtp: true,
        email: result.email,
        devOtp: result.devOtp ?? null,
      };
    }
    // Defensive fallback — if the backend ever returns the legacy direct-
    // session shape, accept it and set the user.
    if (result?.user) setUser(result.user);
    return { pendingOtp: false, user: result?.user };
  }, []);

  // Step 2 of signin. Posts the OTP, server validates and issues session
  // cookies, response contains the user.
  const verifyLoginOtp = useCallback(async ({ email, code }) => {
    const { user } = await api.verifyLoginOtp({ email, code });
    setUser(user);
    return user;
  }, []);

  const signup = useCallback(async (payload) => {
    const result = await api.signup(payload);
    setUser(result.user);
    return result; // includes optional dev `devOtp`
  }, []);

  const signout = useCallback(async () => {
    try {
      await api.signout();
    } catch {
      // Even if the server call fails, drop local state.
    }
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const { user } = await api.me();
    setUser(user);
    return user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      signin,
      verifyLoginOtp,
      signup,
      signout,
      refreshUser,
    }),
    [user, loading, signin, verifyLoginOtp, signup, signout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
