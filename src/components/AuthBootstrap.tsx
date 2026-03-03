"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearAccessToken,
  clearUserMetadata,
  getAccessToken,
  getUserMetadata,
  mainApi,
  setUserMetadata,
} from "@/services";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isPublicPath(pathname: string): boolean {
  return pathname === "/login" || pathname === "/about" || pathname === "/";
}

function isProtectedPath(pathname: string): boolean {
  return pathname.startsWith("/student") || pathname.startsWith("/prof");
}

export default function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!pathname) return;

      setAuthReady(false);

      // Always refresh on every navigation to keep the session alive
      const refreshed = await mainApi.bootstrapAuth();
      const token = refreshed?.accessToken ?? getAccessToken();
      if (!mounted) return;

      if (!token) {
        // Refresh failed — clear session and redirect to login
        clearAccessToken();
        clearUserMetadata();
        if (!isPublicPath(pathname)) {
          router.replace("/login");
          return;
        }
        setAuthReady(true);
        return;
      }

      const currentMetadata = getUserMetadata() || {};
      const payload = decodeJwtPayload(token);
      const tokenRole = String(payload?.role ?? "").toLowerCase();
      const tokenUserId = String(payload?.sub ?? "");

      const nextMetadata = {
        ...currentMetadata,
        id: tokenUserId || currentMetadata.id,
        role: tokenRole || currentMetadata.role,
      };
      setUserMetadata(nextMetadata);

      const role = String(nextMetadata.role || "").toLowerCase();

      if (pathname === "/" || pathname === "/login" || pathname === "/about") {
        router.replace(role === "professor" ? "/prof/home" : "/student/home");
        return;
      }

      if (role === "student" && pathname.startsWith("/prof")) {
        router.replace("/student/home");
        return;
      }

      if (role === "professor" && pathname.startsWith("/student")) {
        router.replace("/prof/home");
        return;
      }

      if (!isPublicPath(pathname) && !isProtectedPath(pathname)) {
        router.replace(role === "professor" ? "/prof/home" : "/student/home");
        return;
      }

      // Auth is resolved and no redirect needed — allow children to render
      setAuthReady(true);
    }

    void bootstrap();
    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  // Don't render children until auth check completes
  if (!authReady) return null;

  return <>{children}</>;
}
