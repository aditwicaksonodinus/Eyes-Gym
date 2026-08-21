// scripts/dev-kill.mjs
//
// Kills any process bound to the dev port(s) so `npm run dev` always starts a
// single, clean server. This mirrors the Landing-CV `dev:kill` convention,
// wired automatically via the `predev` npm hook (see package.json), but is
// cross-platform (no hard dependency on `fuser`/`lsof` being installed).
//
// Usage: node scripts/dev-kill.mjs [port ...]   (defaults to 3000)
//   e.g.  npm run dev:kill -- 3000 3001

import { execFile } from "node:child_process";

const isWin = process.platform === "win32";
const ports = process.argv.slice(2).filter((a) => /^\d+$/.test(a));
const targets = ports.length ? ports : ["3000"];

function run(file, args) {
  return new Promise((resolve) => {
    const p = execFile(file, args, { windowsHide: true }, (err, stdout) => {
      resolve((stdout || "").toString().trim());
    });
    p.on("error", () => resolve(""));
  });
}

async function freePort(port) {
  if (isWin) {
    const out = await run("netstat", ["-ano"]);
    if (!out) return;
    const pids = new Set();
    for (const line of out.split("\n")) {
      if (line.includes(`:${port}`) && /LISTENING/.test(line)) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (/^\d+$/.test(pid)) pids.add(pid);
      }
    }
    for (const pid of pids) await run("taskkill", ["/PID", pid, "/F", "/T"]);
    return;
  }

  // Prefer lsof (precise: only LISTENing sockets on the exact port).
  const out = await run("lsof", ["-ti", `tcp:${port}`, "-sTCP:LISTEN"]);
  if (out) {
    for (const pid of out.split(/\s+/).filter(Boolean)) {
      await run("kill", ["-9", pid]);
    }
    return;
  }
  // Fallback for systems without lsof.
  await run("fuser", ["-k", `${port}/tcp`]);
}

await Promise.all(targets.map((p) => freePort(p)));
console.log(`» Dev port(s) dibersihkan: ${targets.join(", ")}`);
