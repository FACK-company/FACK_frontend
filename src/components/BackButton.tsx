"use client";

import { usePathname } from "next/navigation";

export default function BackButton() {
  const pathname = usePathname();

  // Don't show on home, login, and home pages
  const excludePaths = ["/", "/login", "/student/home", "/prof/home"];

  if (excludePaths.includes(pathname)) {
    return null;
  }

  const handleBack = () => {
    window.history.back();
  };

  return (
    <button onClick={handleBack} className="back-btn" type="button" aria-label="Go back">
      ← Back
    </button>
  );
}
