"use client";

import { useEffect, useState } from "react";

/** Bottom inset when the on-screen keyboard is open (iOS/Android). */
export function useMobileKeyboard() {
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [inputFocused, setInputFocused] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const gap = window.innerHeight - vv.height - vv.offsetTop;
      setKeyboardInset(Math.max(0, Math.round(gap)));
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return { keyboardInset, inputFocused, setInputFocused, keyboardOpen: keyboardInset > 0 };
}
