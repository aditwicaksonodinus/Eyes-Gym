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
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
            className="fixed inset-0 top-14 z-30 bg-background/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
          />
          {/* Slide-out Sidebar container */}
          <div
            className={cn(
              "fixed right-0 top-14 bottom-0 z-30 w-64 bg-background border-l border-border p-6 shadow-2xl flex flex-col gap-4 transition-all duration-300 md:hidden animate-in slide-in-from-right"
            )}
          >
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  asChild
                  variant="ghost"
                  className="w-full justify-start text-foreground text-sm font-medium"
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
