import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError, setAuthFailureHandler } from "../../client/src/api/client";
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

  const signin = useCallback(async (credentials) => {
    const { user } = await api.signin(credentials);
    setUser(user);
    return user;
  }, []);

  const signup = useCallback(async (payload) => {
    const result = await api.signup(payload);
    setUser(result.user);
    return result; // includes optional dev `verifyLink`
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
    () => ({ user, loading, signin, signup, signout, refreshUser }),
    [user, loading, signin, signup, signout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
