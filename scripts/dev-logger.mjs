// scripts/dev-logger.mjs
//
// Tiny, dependency-free dev-only launcher/formatter for `next dev`.
//
// What it does:
//   - (Port clearing is owned by the `predev` npm hook -> scripts/dev-kill.mjs,
//      so `npm run dev` always starts a single, clean server - mirrors the
//      Landing-CV `predev`/`dev:kill` convention.)
//   - Spawns `next dev --turbo` (Turbopack) with any extra CLI args you pass.
//   - Relays stdout/stderr line-by-line; every original line still reaches
//     your terminal untouched except for a colored tag prefix on error/warn
//     lines so they stand out in the noise. Nothing is filtered or dropped.
//   - Auto-restarts when build/config files change (Tailwind, PostCSS, .env,
//     tsconfig, package.json, components.json) - Next.js Fast Refresh already
//     hot-reloads app source, so only config-level files trigger a full restart.
//   - Forwards SIGINT/SIGTERM to the WHOLE Next.js process group, so Ctrl+C
//     cleanly terminates Next.js and all its workers (no orphans left behind).
//   - Exits with the same code as `next dev`.
//
// This file is ONLY used by `npm run dev`. `build` and `start` are untouched.
//
// Tip: prefer `npm run dev` over `npx next dev` - it gives you Turbopack, the
// readability tags, and config auto-restart for free.

import { spawn } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const isWin = process.platform === "win32";

// Resolve the `next` binary from node_modules/.bin so it works without a shell.
const binName = isWin ? "next.cmd" : "next";
const binPath = join(root, "node_modules", ".bin", binName);
const nextBin = existsSync(binPath) ? binPath : binName;

// Only emit ANSI colors when attached to a real terminal (avoid garbled CI logs).
const useColor = Boolean(process.stdout.isTTY && process.stderr.isTTY);
const C = {
  dim: useColor ? "\u001b[2m" : "",
  errTag: useColor ? "\u001b[1;31m" : "", // bold red
  warnTag: useColor ? "\u001b[1;33m" : "", // bold yellow
  reset: useColor ? "\u001b[0m" : "",
};

// Targeted patterns: flag genuine errors/warnings, avoid false positives like
// "0 errors" or "no error".
const ERROR_RE =
  /^(?:⨯|✗|✖|×|error:|error -)|failed to compile|module not found|cannot find module|syntaxerror|typeerror|referenceerror|unhandled (?:rejection|exception)/i;
const WARN_RE = /^(?:⚠|⚠️|warn:|warning:)|warn -|warning:/i;

function decorate(line) {
  if (!line) return line;
  if (ERROR_RE.test(line)) {
    return C.errTag + "✗ ERROR " + C.reset + " " + line;
  }
  if (WARN_RE.test(line)) {
    return C.warnTag + "⚠ WARN  " + C.reset + " " + line;
  }
  return line;
}

// Relay a stream line-by-line, preserving partial trailing lines across chunks.
function relay(source, target) {
  let rest = "";
  source.setEncoding("utf8");
  source.on("data", (chunk) => {
    const text = rest + chunk;
    const lines = text.split("\n");
    rest = lines.pop(); // keep the (possibly partial) last line
    for (const line of lines) {
      target.write(decorate(line) + "\n");
    }
  });
  source.on("end", () => {
    if (rest) target.write(decorate(rest) + "\n");
  });
}

// ---- Main -------------------------------------------------------------------
const cliArgs = process.argv.slice(2);

// Force Turbopack unless the user explicitly opted out / already passed a flag.
const hasTurbo = cliArgs.some(
  (a) => a === "--turbo" || a === "--turbopack" || a.startsWith("--turbopack"),
);
const nextArgs = ["dev", ...(hasTurbo ? [] : ["--turbo"]), ...cliArgs];

// Spawn Next.js (Turbopack) in its own process group so we can kill the
// whole tree on Ctrl+C / restart.
let child = null;
let restarting = false;
let shuttingDown = false;
let restartDebounce = null;

function startChild() {
  child = spawn(nextBin, nextArgs, {
    stdio: ["inherit", "pipe", "pipe"],
    env: process.env,
    detached: !isWin, // POSIX: child becomes its own process-group leader
  });
  relay(child.stdout, process.stdout);
  relay(child.stderr, process.stderr);

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      process.exit(signal ? 1 : (code ?? 0));
      return;
    }
    if (restarting) {
      // Killed on purpose to apply a config change - respawn cleanly.
      restarting = false;
      process.stderr.write(`${C.dim}» Dev server dimulai ulang.${C.reset}\n`);
      startChild();
      return;
    }
    // Unexpected exit (crash). Preserve the exit code.
    process.exit(signal ? 1 : (code ?? 0));
  });
}

// Forward a signal to the WHOLE child process group (workers included), with a
// SIGKILL fallback if the soft signal is ignored.
function terminate(sig) {
  if (!child || child.killed) return;
  if (!isWin && child.pid) {
    try {
      process.kill(-child.pid, sig); // negative pid => entire group
    } catch {
      try {
        child.kill(sig);
      } catch {}
    }
  } else {
    try {
      child.kill(sig);
    } catch {}
  }
}

function doRestart() {
  if (restarting || shuttingDown || !child) return;
  restarting = true;
  process.stderr.write(`${C.dim}» Merestart dev server…${C.reset}\n`);
  terminate("SIGTERM");
  const t = setTimeout(() => {
    if (child && !child.killed) {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {}
    }
  }, 4000);
  t.unref();
}

// ---- Config-file watcher (auto-restart) ------------------------------------
// Next.js Fast Refresh already hot-reloads app source on every edit. But a
// handful of build/config files need a FULL dev-server restart to take effect
// (Tailwind, PostCSS, .env, tsconfig, package.json, components.json). We poll
// their mtimes and restart the child when any changes.
//
// Polling (not fs.watch) is deliberate: editor "save" is often a
// delete+rename, which silently drops an fs.watch handle on the old inode.
// Polling the path always re-stats the live file, so it never misses a change.
const RESTART_TARGETS = [
  "tailwind.config.ts",
  "tailwind.config.js",
  "postcss.config.mjs",
  "postcss.config.js",
  "package.json",
  "tsconfig.json",
  "components.json",
  ".env",
  ".env.local",
  ".env.development",
].map((f) => join(root, f));

function safeMtime(p) {
  try {
    return statSync(p).mtimeMs;
  } catch {
    return -1; // missing file
  }
}

const mtimes = new Map(RESTART_TARGETS.map((p) => [p, safeMtime(p)]));

setInterval(() => {
  if (restarting || shuttingDown) return;
  let changed = null;
  for (const p of RESTART_TARGETS) {
    const m = safeMtime(p);
    if (m !== mtimes.get(p)) {
      mtimes.set(p, m);
      changed = changed ?? p;
    }
  }
  if (!changed) return;
  // Always print the notice (plain when not a TTY); only the color is TTY-gated.
  process.stderr.write(
    `${C.dim}» ${basename(changed)} berubah - jadwal ulang restart…${C.reset}\n`,
  );
  // Debounce: a single save can produce several mtime deltas.
  if (restartDebounce) return;
  restartDebounce = setTimeout(() => {
    restartDebounce = null;
    doRestart();
  }, 400);
  restartDebounce.unref();
}, 1000).unref();

// ---- Boot -------------------------------------------------------------------
startChild();

for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    shuttingDown = true;
    terminate(sig);
    if (!isWin && child && child.pid) {
      // Hard-kill the group after 4s if Next.js ignored the soft signal.
      const t = setTimeout(() => {
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {}
      }, 4000);
      t.unref();
    }
  });
}
