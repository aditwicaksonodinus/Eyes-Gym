// Classic Web Worker for the 20-20-20 reminder timer.
// Runs independently of React; posts a message to the parent window every
// 20 minutes so the app can fire a Web Notification (when the tab is hidden
// and permission is granted). No backend, no push server.

const INTERVAL_MIN = 20;
const INTERVAL_MS = INTERVAL_MIN * 60 * 1000;

self.setInterval(function () {
  self.postMessage({ type: "reminder" });
}, INTERVAL_MS);
