"use client";

import React from "react";
import {
  SiLetsencrypt,
  SiDocker,
  SiSupabase,
  SiPostgresql,
  SiVercel,
  SiGooglecloud,
  SiKubernetes,
  SiNginx,
  SiCloudflare,
  SiGithub,
} from "react-icons/si";

const logos = [
  { Icon: SiLetsencrypt, label: "Let's Encrypt" },
  { Icon: SiDocker, label: "Docker" },
  { Icon: SiSupabase, label: "Supabase" },
  { Icon: SiPostgresql, label: "PostgreSQL" },
  { Icon: SiVercel, label: "Vercel" },
  { Icon: SiGooglecloud, label: "Google Cloud" },
  { Icon: SiKubernetes, label: "Kubernetes" },
  { Icon: SiNginx, label: "Nginx" },
  { Icon: SiCloudflare, label: "Cloudflare" },
  { Icon: SiGithub, label: "GitHub" },
];

// Duplicate for seamless infinite loop
const track = [...logos, ...logos];

export function TrustMarquee() {
  return (
    <section className="relative bg-[#09112a] py-14 overflow-hidden border-y border-cyan-500/10">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-[#09112a] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-[#09112a] to-transparent" />

      {/* Label */}
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 mb-8">
        Trusted technology stack
      </p>

      {/* Scrolling track */}
      <div className="flex overflow-hidden select-none">
        <div className="flex items-center gap-12 animate-marquee whitespace-nowrap">
          {track.map(({ Icon, label }, i) => (
            <div
              key={`${label}-${i}`}
              className="group flex flex-col items-center gap-2.5 px-2 cursor-default"
              title={label}
            >
              <Icon
                className="h-8 w-8 text-blue-200/40 transition-all duration-300
                  group-hover:text-cyan-300 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
              />
              <span className="text-[10px] font-medium tracking-wide text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
