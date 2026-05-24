import { useEffect, useRef, useState } from "react";

export function useFadeIn() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const className = `transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`;
  return { ref, className };
}