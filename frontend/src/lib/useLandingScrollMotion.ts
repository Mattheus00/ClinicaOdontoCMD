import { useEffect, type RefObject } from "react";

type Options = {
  rootRef?: RefObject<HTMLElement | null>;
  heroPhotoSelector?: string;
};

/**
 * Scroll motion inspired by tasteskill.dev:
 * - data-enter reveals (rise + fade) as elements enter the viewport
 * - subtle hero photo parallax tied to scroll progress
 */
export function useLandingScrollMotion({
  rootRef,
  heroPhotoSelector = ".landing-hero-media img",
}: Options = {}) {
  useEffect(() => {
    const scope =
      rootRef?.current ?? document.querySelector<HTMLElement>(".landing");
    if (!scope) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = media.matches;
    let frame = 0;
    let observer: IntersectionObserver | null = null;

    const enterables = () => [
      ...scope.querySelectorAll<HTMLElement>("[data-enter]"),
    ];

    const markAllEntered = () => {
      enterables().forEach((el) => {
        el.dataset.entered = "true";
      });
    };

    const syncReduced = () => {
      reduced = media.matches;
      if (reduced) markAllEntered();
    };
    syncReduced();
    media.addEventListener("change", syncReduced);

    scope.classList.add("enter-ready");

    enterables().forEach((el, index) => {
      if (!el.style.getPropertyValue("--enter-i")) {
        el.style.setProperty("--enter-i", String(index % 6));
      }
    });

    const reveal = (el: HTMLElement) => {
      if (el.dataset.entered === "true") return;
      el.dataset.entered = "true";
      observer?.unobserve(el);
    };

    const revealInView = () => {
      if (reduced) return;
      const viewBottom = window.innerHeight * 0.94;
      enterables().forEach((el) => {
        if (el.dataset.entered === "true") return;
        const rect = el.getBoundingClientRect();
        if (rect.top < viewBottom && rect.bottom > 40) reveal(el);
      });
    };

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            reveal(entry.target as HTMLElement);
          }
        }
      },
      { root: null, rootMargin: "0px 0px -40px 0px", threshold: [0, 0.01, 0.15] },
    );

    enterables().forEach((el) => {
      if (reduced) {
        el.dataset.entered = "true";
        return;
      }
      observer?.observe(el);
    });

    const heroPhoto = scope.querySelector<HTMLElement>(heroPhotoSelector);

    const onFrame = () => {
      revealInView();
      if (reduced || !heroPhoto) return;
      const hero = heroPhoto.closest(".landing-hero");
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      const progress = Math.min(
        1,
        Math.max(0, -rect.top / Math.max(rect.height, 1)),
      );
      heroPhoto.style.translate = `0 ${progress * 10}%`;
      heroPhoto.style.scale = String(1 + progress * 0.05);
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(onFrame);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onFrame();
    const boot = window.setTimeout(onFrame, 80);

    return () => {
      media.removeEventListener("change", syncReduced);
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
      window.clearTimeout(boot);
      scope.classList.remove("enter-ready");
      if (heroPhoto) {
        heroPhoto.style.translate = "";
        heroPhoto.style.scale = "";
      }
    };
  }, [rootRef, heroPhotoSelector]);
}
