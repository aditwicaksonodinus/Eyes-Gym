// scripts/dev-logger.mjs
//
// Tiny, dependency-free dev-only formatter for `next dev`.
//
// Goal: make Next.js compile/runtime errors FAST to spot and clearly READABLE
// in the terminal - without swallowing or hiding any output.
//
// How it works:
//   - Spawns `next dev` (forwarding any extra CLI args you pass).
//   - Relays stdout/stderr line-by-line; every original line still reaches
//     your terminal untouched except for a colored tag prefix on error/warn
//     lines so they stand out in the noise. Nothing is filtered or dropped.
//   - Forwards SIGINT/SIGTERM so `Ctrl+C` cleanly terminates Next.js.
//   - Exits with the same code as `next dev`.
//
// This file is ONLY used by `npm run dev`. `build` and `start` are untouched.

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
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
  errTag: useColor ? "\u001b[1;31m" : "", // bold red
  warnTag: useColor ? "\u001b[1;33m" : "", // bold yellow
  reset: useColor ? "\u001b[0m" : "",
};

// Targeted patterns: flag genuine errors/warnings, avoid false positives like
// "0 errors" or "no error".
const ERROR_RE =
  /^(?:⨯|✗|✖|×|error:|error -)|failed to compile|module not found|cannot find module|syntaxerror|typeerror|referenceerror|unhandled (?:rejection|exception)/i;
const WARN_RE =
  /^(?:⚠|⚠️|warn:|warning:)|warn -|warning:/i;

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

const child = spawn(nextBin, ["dev", ...process.argv.slice(2)], {
  stdio: ["inherit", "pipe", "pipe"],
  env: process.env,
});

relay(child.stdout, process.stdout);
relay(child.stderr, process.stderr);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});

// Forward termination signals so Ctrl+C / `kill` stops Next.js cleanly.
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    if (!child.killed) child.kill(sig);
  });
}
