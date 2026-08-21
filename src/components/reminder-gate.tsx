"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/appStore";
import {
  canVibrate,
  notificationBody,
  shouldShowPrimer,
  type PermissionState,
} from "@/lib/reminder";

function readPermission(): PermissionState {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission as PermissionState;
}

export function ReminderGate() {
  const enabled = useAppStore((s) => s.reminder.enabled);
  const valueMoments = useAppStore((s) => s.reminderMeta.valueMoments);
  const primerShown = useAppStore((s) => s.reminderMeta.primerShown);
  const setReminder = useAppStore((s) => s.setReminder);
  const setPrimerShown = useAppStore((s) => s.setPrimerShown);

  const [mounted, setMounted] = React.useState(false);
  const [permission, setPermission] = React.useState<PermissionState>("unsupported");
  const [panelOpen, setPanelOpen] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (mounted) setPermission(readPermission());
  }, [mounted]);

  // Spin up the Web Worker only while the reminder is enabled.
  React.useEffect(() => {
    if (!mounted || !enabled || typeof Worker === "undefined") return;

    const worker = new Worker("/reminder-worker.js");
    worker.onmessage = (event: MessageEvent) => {
      if (event.data?.type !== "reminder") return;
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      ) {
        if (readPermission() === "granted") {
          navigator.serviceWorker?.ready.then((reg) => {
            reg.showNotification(notificationBody(), {
              body: notificationBody(),
              icon: "/icon-192.png",
            });
          });
        }
        if (canVibrate()) navigator.vibrate(200);
      }
    };

    return () => worker.terminate();
  }, [mounted, enabled]);

  const showPrimer =
    mounted && !primerShown && shouldShowPrimer({ valueMoments, enabled, permission });

  // requestPermission is ONLY ever called from an explicit user tap.
  const enableReminder = async () => {
    if (typeof Notification === "undefined") {
      setPermission("unsupported");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result as PermissionState);
    if (result === "granted") setReminder({ enabled: true });
  };

  const disableReminder = () => setReminder({ enabled: false });

  const onToggle = () => {
    if (enabled) disableReminder();
    else void enableReminder();
  };

  if (!mounted) return null;

  const denied = permission === "denied";

  return (
    <>
      {/* Floating settings control */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {panelOpen && (
          <div className="w-72 rounded-lg border border-border bg-background p-4 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">Pengingat 20-20-20</span>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label="Aktifkan pengingat 20-20-20"
                onClick={onToggle}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  enabled ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    enabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Pengingat berjalan saat tab terbuka (termasuk di latar belakang).
              Tidak aktif bila tab ditutup sepenuhnya.
            </p>

            {denied && (
              <p className="mt-3 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                Izin notifikasi ditolak. Aktifkan kembali dari pengaturan situs
                peramban Anda, lalu muat ulang halaman ini.
              </p>
            )}
          </div>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setPanelOpen((o) => !o)}
          aria-expanded={panelOpen}
        >
          Pengingat
        </Button>
      </div>

      {/* Primer modal — shown once after the first value moment */}
      {showPrimer && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reminder-primer-title"
        >
          <div className="w-full max-w-sm rounded-lg border border-border bg-background p-6 shadow-xl">
            <h2
              id="reminder-primer-title"
              className="text-lg font-semibold text-foreground"
            >
              Aktifkan pengingat 20-20-20?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Kami dapat mengingatkan Anda setiap 20 menit untuk istirahat mata,
              selama tab ini tetap terbuka.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setPrimerShown(true)}
              >
                Nanti
              </Button>
              <Button onClick={() => void enableReminder()}>
                Aktifkan pengingat
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ReminderGate;
