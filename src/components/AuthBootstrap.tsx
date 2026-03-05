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

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  const exp = Number(payload?.exp ?? 0);
  if (!exp) return true;
  return Date.now() >= exp * 1000;
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
      const needsAuth = isProtectedPath(pathname);

      let token = getAccessToken();
      if (!token || isTokenExpired(token)) {
        const refreshed = await mainApi.bootstrapAuth();
        token = refreshed?.accessToken ?? getAccessToken();
      }
      if (!mounted) return;

      if (!token) {
        clearAccessToken();
        clearUserMetadata();
        if (needsAuth) {
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

      setAuthReady(true);
    }

    void bootstrap();
    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (!authReady) return null;

  return <>{children}</>;
}