"use client";

import { useEffect } from "react";

export function MarkTakenBezocht() {
  useEffect(() => {
    localStorage.setItem("tuin_taken_bezocht", "1");
  }, []);
  return null;
}
