import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/test", label: "Tes Mata" },
  { href: "/exercises", label: "Senam Mata" },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav
        className={cn(
          "mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3"
        )}
        aria-label="Navigasi utama"
      >
        <Link
          href="/"
          className="text-lg font-semibold tracking-wide text-foreground transition-colors hover:text-primary"
        >
          Senam Mata
        </Link>

        <div className="flex flex-wrap items-center gap-1">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              asChild
              variant="ghost"
              className="text-foreground"
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
