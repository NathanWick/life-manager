"use client";

import { useEffect } from "react";

/** Scroll to #agent when landing with hash (e.g. from bottom nav). */
export function HashScroll() {
  useEffect(() => {
    const scrollToAgent = () => {
      if (window.location.hash === "#agent") {
        const el = document.getElementById("agent");
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    scrollToAgent();
    window.addEventListener("hashchange", scrollToAgent);
    return () => window.removeEventListener("hashchange", scrollToAgent);
  }, []);

  return null;
}
