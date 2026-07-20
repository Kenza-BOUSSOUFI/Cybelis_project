"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Globe, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, fadeUp } from "./animations";

interface HeroSectionProps {
  scanInput: string;
  setScanInput: (v: string) => void;
}

export function HeroSection({ scanInput, setScanInput }: HeroSectionProps) {
  return (
    <section className="relative pt-36 pb-28 px-6 text-center z-10 overflow-hidden">

      {/* Background Image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/hero-bg2.jpg"
          alt="Cybersecurity background"
          fill
          priority
          className="object-cover object-center"
          quality={90}
        />
        {/* Multi-stop overlay for depth and readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#090e1f]/85 via-[#090e1f]/72 to-[#09112a]" />
        {/* Subtle radial accent top-right */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_0%,rgba(37,99,235,0.12),transparent)]" />
      </div>

      {/* Floating geometry - refined, low-opacity */}
      <div
        className="absolute top-14 left-10 w-16 h-16 border border-cyan-400/10 rounded-2xl rotate-12 animate-float"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-24 right-14 w-10 h-10 border border-sky-400/10 rounded-xl rotate-45 animate-float"
        style={{ animationDelay: "3s" }}
      />
      <div
        className="absolute bottom-12 left-1/4 w-7 h-7 border border-cyan-500/10 rounded-lg rotate-12 animate-float"
        style={{ animationDelay: "2s" }}
      />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="space-y-6 max-w-7xl mx-auto"
      >
        {/* Eyebrow badge */}
        <motion.div variants={fadeUp} className="flex justify-center">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Professional Web Security
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          className="text-4xl md:text-[4.5rem] font-semibold tracking-[-0.04em] max-w-4xl mx-auto leading-[1.05] text-white"
        >
          Discover your website's security{" "}
          <span className="block text-white/90 mt-2">
            before attackers do.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          className="text-base md:text-lg max-w-xl mx-auto leading-7 text-slate-400"
        >
          Scan your website using professional cybersecurity tools, identify vulnerabilities, evaluate your security posture, and generate detailed reports from a single dashboard.
        </motion.p>

        {/* Search bar CTA */}
        <motion.div variants={fadeUp} className="max-w-xl mx-auto pt-6">
          <div className="p-1.5 rounded-2xl bg-[#0d1630]/80 border border-cyan-500/15 backdrop-blur-md flex flex-col sm:flex-row gap-2 shadow-2xl shadow-black/50">
            <div className="flex-1 flex items-center gap-3 px-4">
              <Globe className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Enter your domain"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                className="bg-transparent border-0 text-white placeholder-slate-600 focus:outline-none focus:ring-0 w-full text-sm"
              />
            </div>
            <Link
              href={`/dashboard/scan?domain=${encodeURIComponent(scanInput || "cybelis.ma")}`}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-blue-600/25 shrink-0"
            >
              Start free scan
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
        </motion.div>
      </motion.div>
    </section>
  );
}
