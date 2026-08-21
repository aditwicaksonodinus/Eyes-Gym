import React from 'react';

interface TargetWrapperProps {
  /**
   * When true, the children are wrapped in a full‑screen flex container that
   * centers them both vertically and horizontally. When false, the children are
   * rendered without any extra wrapper.
   */
  enabled?: boolean;
  children: React.ReactNode;
}

/**
 * Utility wrapper used to conditionally add the outer absolute inset container
 * around a target element (e.g., the eye‑focus icon). This mirrors the original
 * HTML structure:
 *   <div className="absolute inset-0 flex items-center justify-center">…</div>
 * The wrapper is optional via the `enabled` prop so the same component can be
 * reused in contexts where the extra container isn’t needed.
 */
export default function TargetWrapper({ enabled = true, children }: TargetWrapperProps) {
  if (!enabled) return <>{children}</>;
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {children}
    </div>
  );
}
