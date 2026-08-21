"use client";

import * as React from "react";
import { RotateCw, X } from "lucide-react";

/**
 * Non-blocking reminder shown only on small screens held in portrait.
 * Uses a media-query listener so it disappears the moment the device is
 * rotated to landscape or the viewport grows past the mobile breakpoint.
 */
export function OrientationGate() {
  const [mounted, setMounted] = React.useState(false);
  const [isPortraitMobile, setIsPortraitMobile] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia(
      "(max-width: 767px) and (orientation: portrait)"
    );
    const update = () => setIsPortraitMobile(mq.matches);

    update();
    mq.addEventListener("change", update);
    // Fallback for browsers/embeds where orientationchange fires but the
    // matchMedia "change" event is delayed.
    window.addEventListener("orientationchange", update);
    window.addEventListener("resize", update);

    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  if (!mounted || !isPortraitMobile || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[55] max-w-[calc(100vw-2rem)]"
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-lg border border-border bg-background/95 px-4 py-2 text-sm text-foreground shadow-lg backdrop-blur">
        <RotateCw className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span>Putar perangkat ke mode lanskap agar nyaman.</span>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Tutup pengingat"
          className="ml-1 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

export default OrientationGate;
