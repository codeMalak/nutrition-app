import { useEffect, useRef } from "react";

const CONTAINER_ID = "container-be31c58e35dac8eeb0699a8eb0551d17";
const ADSTERRA_SRC =
  "https://pl29604187.effectivecpmnetwork.com/be31c58e35dac8eeb0699a8eb0551d17/invoke.js";

export default function AdBanner({ className = "" }) {
  const wrapperRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const script = document.createElement("script");
    script.src = ADSTERRA_SRC;
    script.async = true;
    script.setAttribute("data-cfasync", "false");

    // Append script right after the container div so Adsterra finds it
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
