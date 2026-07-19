"use client";

import { useState } from "react";
import { Navbar } from "@/components/landingPage/Navbar";
import { HeroSection } from "@/components/landingPage/HeroSection";
import { PlatformLanding } from "@/components/landingPage/PlatformLanding";

export default function LandingPage() {
  const [scanInput, setScanInput] = useState("");
  return (
    <div className="min-h-screen bg-[#09112a]">
      <Navbar />
      <HeroSection scanInput={scanInput} setScanInput={setScanInput} />
      <PlatformLanding />
    </div>
  );
}
