"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/test", label: "Tes Mata" },
  { href: "/exercises", label: "Latihan" },
] as const;

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Lock body scroll when sidebar is open (standard mobile architecture)
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close sidebar on Escape key press (keyboard accessibility)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <header className="sticky top-0 z-navbar w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 h-14"
          aria-label="Navigasi utama"
        >
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-wide text-foreground transition-colors hover:text-primary shrink-0"
          >
            <Image
              src="/icon.svg"
              alt="SeeFit logo"
              width={24}
              height={24}
              className="rounded-md"
              priority
            />
            SeeFit
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
      </header>


      {/* Mobile Drawer — rendered via Portal at document.body to escape header stacking context */}
      {isMounted && ReactDOM.createPortal(
        <>
          {/* Backdrop */}
          <div
            className={cn(
              "fixed inset-0 z-backdrop bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300",
              isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setIsOpen(false)}
          />
          {/* Slide-out Sidebar container */}
          <div
            className={cn(
              "fixed right-0 top-0 bottom-0 z-sidebar w-72 bg-background border-l border-border p-6 shadow-2xl flex flex-col gap-6 transition-all duration-300 ease-in-out md:hidden transform",
              isOpen
                ? "translate-x-0 opacity-100"
                : "translate-x-full opacity-0 pointer-events-none invisible"
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi"
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
        </>,
        document.body
      )}
    </>
  );
}

export default Navbar;
