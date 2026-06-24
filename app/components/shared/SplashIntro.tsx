"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimate } from "framer-motion";
import APP_CONFIG from "@/app/configs/app-config";
import useSplashStore from "@/app/store/useSplashStore";
import BrandMark from "./BrandMark";

// Rendered once at the app root (Providers). On first load it covers the screen
// with the brand logo, holds for a beat, then flies the logo into the navbar's
// logo slot (#brand-logo-target) while the white backdrop fades away. The navbar
// logo itself stays hidden (via useSplashStore.done) until the flight lands, so
// the hand-off reads as one continuous mark settling into place.
//
// If there's no navbar on screen (e.g. the logged-out auth pages) the logo just
// fades out centered. Plays once per page load; client navigations don't replay.

const SPLASH_LOGO_PX = 168; // on-screen size of the splash logo box

// Polls for the navbar's logo slot until it exists or the timeout elapses.
const waitForTarget = (
  maxMs: number,
  isCancelled: () => boolean,
): Promise<HTMLElement | null> =>
  new Promise((resolve) => {
    const start = Date.now();
    const tick = () => {
      if (isCancelled()) return resolve(null);
      const el = document.getElementById("brand-logo-target");
      if (el) return resolve(el);
      if (Date.now() - start >= maxMs) return resolve(null);
      setTimeout(tick, 80);
    };
    tick();
  });

const SplashIntro = () => {
  const [scope, animate] = useAnimate<HTMLDivElement>(); // scope = container
  const backdropRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const setDone = useSplashStore((s) => s.setDone);
  const [visible, setVisible] = useState(true);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const finish = () => {
      setDone();
      setVisible(false);
    };

    let cancelled = false;

    const run = async () => {
      const logo = logoRef.current;
      if (!logo) return finish();

      // Intro — wrapper rises in (BrandMark runs its own staggered bloom; keep
      // wrapper scale at 1 so the two don't compound).
      await animate(
        logo,
        { opacity: 1, y: 0 },
        { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
      );
      if (labelRef.current) {
        animate(
          labelRef.current,
          { opacity: 1, y: 0 },
          { duration: 0.5, ease: "easeOut" },
        );
      }
      if (cancelled) return;

      // Let the mark finish blooming, then a soft heartbeat — the union
      // breathing — before it lifts off toward the navbar.
      await new Promise((r) => setTimeout(r, 1000));
      if (cancelled) return;
      await animate(
        logo,
        { scale: [1, 1.045, 1] },
        { duration: 0.7, ease: "easeInOut" },
      );
      if (cancelled) return;

      // The navbar mounts only after auth/profile resolve, which can outlast
      // the hold on a slow network. Wait (bounded) for its logo slot to appear
      // so the flight still lands instead of degrading to a centered fade.
      const target = await waitForTarget(2000, () => cancelled);
      if (cancelled) return;

      // Fade the tagline out before the logo takes off.
      if (labelRef.current) {
        animate(labelRef.current, { opacity: 0, y: 8 }, { duration: 0.25 });
      }

      if (target) {
        const rect = target.getBoundingClientRect();
        // Measure the logo's real box rather than assuming window-center — the
        // tagline below shifts it up, so a window-center start would mis-land.
        const logoRect = logo.getBoundingClientRect();
        const startX = logoRect.left + logoRect.width / 2;
        const startY = logoRect.top + logoRect.height / 2;
        const dx = rect.left + rect.width / 2 - startX;
        const dy = rect.top + rect.height / 2 - startY;
        const scale = rect.height / logoRect.height;

        // Flight = transform only (GPU-composited, no per-frame repaint). The
        // backdrop fades as its own layer so the logo stays crisp + opaque.
        await Promise.all([
          animate(
            logo,
            { x: dx, y: dy, scale },
            { duration: 0.85, ease: [0.5, 0, 0.2, 1] },
          ),
          animate(
            backdropRef.current,
            { opacity: 0 },
            { duration: 0.5, delay: 0.3, ease: "easeInOut" },
          ),
        ]);
      } else {
        // No navbar to land in — fade out in place.
        await Promise.all([
          animate(backdropRef.current, { opacity: 0 }, { duration: 0.5 }),
          animate(logo, { opacity: 0, scale: 1.04 }, { duration: 0.5 }),
        ]);
      }

      if (cancelled) return;
      finish();
    };

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={scope}
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center"
    >
      {/* Backdrop layer — fades on its own so the flying logo stays crisp. The
          blurred blobs live here and are never recomposited mid-flight. */}
      <div
        ref={backdropRef}
        style={{ willChange: "opacity" }}
        className="absolute inset-0 bg-white"
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/4 -left-1/4 h-1/2 w-1/2 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-secondary/10 blur-[120px]" />
        </div>
      </div>

      <motion.div
        ref={logoRef}
        initial={{ opacity: 0, y: 24 }}
        style={{
          width: SPLASH_LOGO_PX,
          height: SPLASH_LOGO_PX,
          willChange: "transform",
        }}
        className="relative"
      >
        <BrandMark animated className="h-full w-full" />
      </motion.div>

      <motion.p
        ref={labelRef}
        initial={{ opacity: 0, y: 12 }}
        className="relative mt-6 text-xl font-semibold tracking-wide text-primary"
      >
        {APP_CONFIG.APP_NAME}
      </motion.p>
    </div>
  );
};

export default SplashIntro;
