import { useEffect } from "react";

/**
 * Adds the `reveal-visible` class to any element with the `reveal` class
 * once it scrolls into view. Idempotent — safe to mount on every page.
 */
export function useScrollReveal() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;

    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.reveal-visible)"));
    if (elements.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
