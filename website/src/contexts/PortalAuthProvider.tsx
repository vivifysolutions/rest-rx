"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ApiError, getMe, healthCheck } from "@/lib/api";
import type { ApiUser } from "@/lib/types";
import {
  getHomeRouteForUserType,
  hasPortalAccess as userTypeHasPortalAccess,
  type UserType,
} from "@/lib/user-types";

type ApiStatus = "unknown" | "checking" | "ok" | "unreachable" | "not-configured";

type PortalAuthContextValue = {
  user: User | null;
  profile: ApiUser | null;
  token: string | null;
  loading: boolean;
  profileError: string | null;
  apiUrl: string;
  apiStatus: ApiStatus;
  apiConfigured: boolean;
  userType: UserType | null;
  hasPortalAccess: boolean;
  homeRoute: string;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  refreshProfile: () => Promise<ApiUser>;
  pingApi: () => Promise<void>;
};

const PortalAuthContext = createContext<PortalAuthContextValue | null>(null);

const log = (...args: unknown[]) => {
  if (typeof window !== "undefined") {
    console.info("[Portal]", ...args);
  }
};

const logError = (...args: unknown[]) => {
  if (typeof window !== "undefined") {
    console.error("[Portal]", ...args);
  }
};

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ApiUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("unknown");

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "");
  const apiConfigured = apiUrl.length > 0;

  const userType = profile?.userType ?? null;
  const portalAccess = userTypeHasPortalAccess(userType);
  const homeRoute = userType ? getHomeRouteForUserType(userType) : "/portal/login";

  // Track in-flight profile loads so we don't double-fetch.
  const loadingForUidRef = useRef<string | null>(null);

  const pingApi = useCallback(async () => {
    if (!apiConfigured) {
      setApiStatus("not-configured");
      return;
    }
    setApiStatus("checking");
    try {
      log(`Pinging ${apiUrl}/health…`);
      await healthCheck();
      log("API health: ok");
      setApiStatus("ok");
    } catch (err) {
      logError("API health check failed", err);
      setApiStatus("unreachable");
    }
  }, [apiUrl, apiConfigured]);

  // One-time health check on mount.
  useEffect(() => {
    pingApi();
  }, [pingApi]);

  const loadProfile = useCallback(
    async (firebaseUser: User): Promise<ApiUser> => {
      if (!apiConfigured) {
        const msg =
          "NEXT_PUBLIC_API_URL is not set. Add it to website/.env.local and restart the dev server.";
        setProfileError(msg);
        setProfile(null);
        throw new Error(msg);
      }

      log("Fetching ID token…");
      const idToken = await firebaseUser.getIdToken(true);
      setToken(idToken);

      log(`GET ${apiUrl}/users/me`);
      try {
        const me = await getMe(idToken);
        log("Profile loaded", { id: me.id, email: me.email, userType: me.userType });
        setProfile(me);
        setProfileError(null);
        setApiStatus("ok");
        return me;
      } catch (err) {
        setProfile(null);
        const msg =
          err instanceof ApiError
            ? err.status === 0
              ? `Cannot reach API at ${apiUrl}. Is the rest-and-rx API running and is CORS allowing http://localhost:9000?`
              : `API error ${err.status}: ${err.message}`
            : err instanceof Error
              ? err.message
              : "Failed to load profile from API";
        logError("Profile load failed:", msg, err);
        setProfileError(msg);
        if (err instanceof ApiError && err.status === 0) {
          setApiStatus("unreachable");
        }
        throw new Error(msg);
      }
    },
    [apiConfigured, apiUrl],
  );

  const refreshToken = useCallback(async () => {
    if (!auth.currentUser) {
      setToken(null);
      return null;
    }
    const next = await auth.currentUser.getIdToken(true);
    setToken(next);
    return next;
  }, []);

  const refreshProfile = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Not signed in");
    return loadProfile(firebaseUser);
  }, [loadProfile]);

  // Single auth subscription: this is the only place that triggers profile loads.
  useEffect(() => {
    log("Subscribing to Firebase auth state changes");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      log("onAuthStateChanged", { uid: firebaseUser?.uid ?? null, email: firebaseUser?.email ?? null });
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setToken(null);
        setProfileError(null);
        loadingForUidRef.current = null;
        setLoading(false);
        return;
      }

      // Avoid duplicate concurrent loads for the same uid.
      if (loadingForUidRef.current === firebaseUser.uid) {
        log("Profile load already in flight for this user");
        return;
      }
      loadingForUidRef.current = firebaseUser.uid;

      setLoading(true);
      try {
        await loadProfile(firebaseUser);
      } catch {
        // profileError state already set inside loadProfile
      } finally {
        loadingForUidRef.current = null;
        setLoading(false);
      }
    });

    return () => {
      log("Unsubscribing from Firebase auth");
      unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    log(`Firebase sign in attempt: ${email}`);
    setProfileError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      log("Firebase sign in success — waiting for profile load");
    } catch (err) {
      logError("Firebase sign in failed", err);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    log("Signing out");
    await firebaseSignOut(auth);
    setProfile(null);
    setProfileError(null);
    setToken(null);
  }, []);

  const value = useMemo<PortalAuthContextValue>(
    () => ({
      user,
      profile,
      token,
      loading,
      profileError,
      apiUrl,
      apiStatus,
      apiConfigured,
      userType,
      hasPortalAccess: portalAccess,
      homeRoute,
      signIn,
      signOut,
      refreshToken,
      refreshProfile,
      pingApi,
    }),
    [
      user,
      profile,
      token,
      loading,
      profileError,
      apiUrl,
      apiStatus,
      apiConfigured,
      userType,
      portalAccess,
      homeRoute,
      signIn,
      signOut,
      refreshToken,
      refreshProfile,
      pingApi,
    ],
  );

  return (
    <PortalAuthContext.Provider value={value}>{children}</PortalAuthContext.Provider>
  );
}

export function usePortalAuth(): PortalAuthContextValue {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) {
    throw new Error("usePortalAuth must be used within PortalAuthProvider");
  }
  return ctx;
}
