"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/test", label: "Tes Mata" },
  { href: "/exercises", label: "Senam Mata" },
] as const;

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);

  // Close sidebar on window resize if it transitions to desktop size
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header className="sticky top-0 z-navbar w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 h-14"
        aria-label="Navigasi utama"
      >
        <Link
          href="/"
          className="text-lg font-semibold tracking-wide text-foreground transition-colors hover:text-primary shrink-0"
        >
          Senam Mata
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
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

        {/* Mobile Navigation controls */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={isOpen}
            className="text-foreground"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Drawer/Sidebar panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-backdrop bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />
          {/* Slide-out Sidebar container */}
          <div
            className={cn(
              "fixed right-0 top-0 bottom-0 z-sidebar w-72 bg-background border-l border-border p-6 shadow-2xl flex flex-col gap-6 transition-all duration-300 md:hidden animate-in slide-in-from-right"
            )}
          >
            {/* Sidebar Header inside drawer */}
            <div className="flex items-center justify-between border-b border-border/40 pb-4 shrink-0">
              <span className="font-semibold text-foreground text-sm">Navigasi</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                aria-label="Tutup menu"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  asChild
                  variant="ghost"
                  className="w-full justify-start text-foreground text-sm font-medium h-10 px-3"
                  onClick={() => setIsOpen(false)}
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
}

export default Navbar;
