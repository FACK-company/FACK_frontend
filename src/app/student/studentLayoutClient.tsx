"use client";

import { useEffect, useState } from "react";
import { getUserMetadata } from "@/services";
import SilentVerificationOverlay from "@/components/SilentVerificationOverlay";

export default function StudentLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    const metadata = getUserMetadata();
    setStudentId(metadata?.id ?? null);
  }, []);

  return (
    <>
      {children}
      {studentId ? <SilentVerificationOverlay studentId={studentId} /> : null}
    </>
  );
}
