import { useEffect, useRef } from "react";

const ADSTERRA_SRC =
  "https://pl29604118.effectivecpmnetwork.com/c4/d7/69/c4d769a199c53735404c22d10da1f68e.js";

export default function AdBanner({ className = "" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.src = ADSTERRA_SRC;
    script.async = true;
    container.appendChild(script);

    return () => {
      if (container && container.contains(script)) {
        container.removeChild(script);
      }
    };
  }, []);

  return <div ref={containerRef} className={className} />;
}
