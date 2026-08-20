"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "#platform", label: "À propos" },
  { href: "#features", label: "Fonctionnalités" },
  { href: "#tools", label: "Outils" },
  { href: "#team", label: "Équipe" },
  { href: "#pricing", label: "Tarifs" },
  { href: "#resources", label: "Ressources" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 22, delay: 0.1 }}
      className="fixed left-0 right-0 top-0 z-50"
    >
      <div
        className={`transition-all duration-300 ${
          scrolled
            ? "bg-[#09112a]/90 backdrop-blur-xl border-b border-cyan-500/10 shadow-lg shadow-black/20"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          {/* Logo - scale transform bypasses transparent PNG padding */}
          <Link href="/" className="flex items-center shrink-0 overflow-visible">
            <motion.img
              src="/logo.png"
              alt="Clarveon"
              className="h-14 w-auto origin-left scale-[3.2] block"
              whileHover={{ opacity: 0.85 }}
              transition={{ duration: 0.2 }}
            />
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden lg:flex items-center gap-1"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {navLinks.map(({ href, label }, i) => (
              <a
                key={href}
                href={href}
                className="relative px-3.5 py-2 text-sm text-slate-300 hover:text-white transition-colors rounded-lg"
                onMouseEnter={() => setHoveredIdx(i)}
              >
                {/* Hover pill */}
                {hoveredIdx === i && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-white/[0.07]"
                    initial={false}
                    transition={{ type: "spring", stiffness: 280, damping: 28 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </a>
            ))}
          </nav>

          {/* CTA group */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:opacity-90 transition-opacity"
            >
              Connexion
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white sm:hidden p-1.5"
            aria-label="Menu"
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden border-t border-white/8 bg-[#09112a]/95 backdrop-blur-xl sm:hidden"
            >
              <div className="flex flex-col gap-1 px-6 py-4">
                {navLinks.map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="py-2.5 text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                ))}
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
                  <Link
                    href="/login"
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white text-center"
                  >
                    Connexion
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
