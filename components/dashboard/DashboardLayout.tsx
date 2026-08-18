"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  Sliders,
  TrendingUp,
  History,
  Settings,
  HelpCircle,
  Bell,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  FileText,
  Search
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // User info from Supabase
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userCompany, setUserCompany] = useState("");
  const [userInitials, setUserInitials] = useState("?");

  const supabase = createClient();

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const fullName: string = user.user_metadata?.full_name ?? "";
        const company: string = user.user_metadata?.company ?? "";
        const email: string = user.email ?? "";

        setUserName(fullName || email.split("@")[0]);
        setUserEmail(email);
        setUserCompany(company);

        // Initials from full name or email
        const parts = (fullName || email).split(/[\s@]/);
        const initials = parts
          .slice(0, 2)
          .map((p: string) => p[0]?.toUpperCase() ?? "")
          .join("");
        setUserInitials(initials || "?");
      }
    };
    loadUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Nav items list
  const navItems = [
    { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
    { name: "Nouveau Scan", href: "/dashboard/scan", icon: Activity },
    { name: "Historique", href: "/dashboard/history", icon: History },
    { name: "Rapports", href: "/dashboard/reports", icon: FileText },
    { name: "Outils", href: "/dashboard/tools", icon: Sliders },
    { name: "Comparaison", href: "/dashboard/compare", icon: TrendingUp },
    { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
    { name: "Profil", href: "/dashboard/profile", icon: User },
    { name: "Aide", href: "/dashboard/help", icon: HelpCircle },
  ];

  // Mock Notifications
  const [notifications, setNotifications] = useState([
    { id: 1, title: "SSL critique", text: "Le certificat SSL de client-site.ma expire dans 12 jours.", time: "Il y a 2h", read: false },
    { id: 2, title: "Nouveau scan complété", text: "L'analyse globale de mon-startup.ma est terminée. Score: 85/100", time: "Il y a 1 jour", read: true },
  ]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#f8fbff] text-slate-900 flex font-sans selection:bg-blue-500 selection:text-white">

      {/* 1. SIDEBAR (DESKTOP) */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 border-r border-slate-200 bg-white shrink-0 shadow-sm z-20">

        {/* Sidebar Logo — company name */}
        <div className="h-20 px-6 border-b border-slate-200 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {userInitials}
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight truncate max-w-[140px] block">
                {userCompany || "Mon espace"}
              </span>
              <span className="text-[9px] block font-mono text-indigo-400">DASHBOARD</span>
            </div>
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="px-3 mb-2 text-xs font-mono font-bold text-blue-600 uppercase tracking-widest">
            Audit SaaS
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isActive
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-sm font-bold text-red-600 hover:bg-red-100 hover:border-red-200 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>

      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto lg:ml-64">

        {/* Top Header */}
        <header className="h-20 border-b border-slate-200 bg-white/85 backdrop-blur-md px-6 flex items-center justify-between fixed top-0 right-0 left-0 lg:left-64 z-40">

          {/* Mobile hamburger & title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Search bar */}
            <form
              onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) router.push(`/dashboard/history`); }}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 w-56"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un domaine…"
                className="bg-transparent border-0 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 w-full"
              />
            </form>
          </div>

          {/* User & Notifications Controls */}
          <div className="flex items-center gap-4 relative">

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserDropdown(false);
                }}
                className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-600 border border-white text-[9px] font-bold text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 p-4 rounded-2xl bg-white border border-slate-200 shadow-[0_12px_40px_-20px_rgba(59,130,246,0.14)] z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    <button onClick={markAllRead} className="text-[10px] text-blue-600 hover:underline font-medium">Marquer comme lu</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-2.5 rounded-xl border text-xs ${n.read ? "bg-slate-50 border-slate-100 opacity-70" : "bg-blue-50/50 border-blue-100"}`}>
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-slate-900">{n.title}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{n.time}</span>
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1 leading-normal">{n.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 p-1.5 pr-3.5 rounded-xl bg-white border border-slate-200 text-left hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                  {userInitials}
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[100px]">{userName || "…"}</div>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-3 w-52 p-3 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl z-50 space-y-1">
                  <div className="px-2 py-1.5 border-b border-neutral-800 mb-1.5">
                    <span className="block text-xs font-bold text-white">{userName || "…"}</span>
                    <span className="block text-[9px] text-neutral-500 font-mono truncate">{userEmail}</span>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-blue-400 hover:bg-neutral-800 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Paramètres</span>
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-blue-400 hover:bg-neutral-800 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>Mon Profil</span>
                  </Link>
                  <button
                    onClick={() => { setShowUserDropdown(false); handleSignOut(); }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors border-t border-neutral-800 mt-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* Dashboard Pages Root */}
        <main className="flex-1 p-6 lg:p-8 mt-20">
          {children}
        </main>
      </div>

      {/* 3. MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/40 backdrop-blur-sm animate-fade-in">

          <div className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col justify-between shadow-xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-7 h-7 overflow-hidden flex items-center shrink-0">
                    <img src="/logo.png" alt="Cybelis Logo" className="block h-7 w-auto origin-left scale-[2.4]" />
                  </div>
                  <span className="text-lg font-bold tracking-tight text-slate-900">Cybelis</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded bg-white border border-slate-200 text-slate-500 shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive
                        ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-sky-100"
                        : "text-slate-500 hover:text-blue-700 hover:bg-slate-50"
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-2.5 text-xs text-neutral-400">
              <div className="w-7 h-7 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">
                {userInitials}
              </div>
              <div className="overflow-hidden flex-1">
                <div className="font-bold text-white truncate">{userName || "…"}</div>
                <div className="text-[10px] text-neutral-500 font-mono truncate">{userCompany || userEmail}</div>
              </div>
              <button onClick={handleSignOut} className="p-1 text-red-400 hover:bg-red-500/10 rounded shrink-0">
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}