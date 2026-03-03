"use client";

import { useEffect } from "react";
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

export default function AuthBootstrap() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      if (!pathname) return;

      const needsAuth = isProtectedPath(pathname);

      // Always refresh on every navigation to keep the session alive
      const refreshed = await mainApi.bootstrapAuth();
      console.log("AuthBootstrap: Refreshed token", refreshed);
      const token = refreshed?.accessToken ?? getAccessToken();
      console.log("AuthBootstrap: Current access token", token);
      if (!mounted) return;

      if (!token) {
        // Refresh failed — clear session and redirect to homepage
        clearAccessToken();
        clearUserMetadata();
        router.replace("/login");
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
      }
    }

    void bootstrap();
    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  return null;
}
