import { useEffect, useRef } from "react";

const CONTAINER_ID = "container-be31c58e35dac8eeb0699a8eb0551d17";

// Script is proxied through your own backend so ad blockers
// filtering known ad-network domains won't intercept it.
const AD_SRC = "/api/v1/metrics.js";

export default function AdBanner({ className = "" }) {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const script = document.createElement("script");
    script.src = AD_SRC;
    script.async = true;
    script.setAttribute("data-cfasync", "false");

    wrapper.appendChild(script);

    return () => {
      if (wrapper && wrapper.contains(script)) {
        wrapper.removeChild(script);
      }
    };
  }, []);

  return (
    <div ref={wrapperRef} className={className}>
      <div id={CONTAINER_ID} />
    </div>
  );
}
