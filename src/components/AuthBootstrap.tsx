"use client";

import { useEffect } from "react";
import { mainApi } from "@/services";

export default function AuthBootstrap() {
  useEffect(() => {
    void mainApi.bootstrapAuth();
  }, []);

  return null;
}
