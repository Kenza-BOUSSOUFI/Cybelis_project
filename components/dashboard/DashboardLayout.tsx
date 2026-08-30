"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
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
  Search,
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

  const supabase = createClient();

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const fullName: string = user.user_metadata?.full_name ?? user.user_metadata?.name ?? "";
        let company: string = user.user_metadata?.company ?? user.user_metadata?.companyName ?? user.user_metadata?.company_name ?? "";
        const email: string = user.email ?? "";

        setUserName(fullName || email.split("@")[0]);
        setUserEmail(email);

        if (!company) {
          try {
            const res = await fetch("/api/user/profile");
            if (res.ok) {
              const data = await res.json();
              if (data?.user?.companyName) {
                company = data.user.companyName;
              }
            }
          } catch {
            // ignore fallback error
          }
        }
        setUserCompany(company);
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans selection:bg-slate-900 selection:text-white">

      {/* 1. SIDEBAR (DESKTOP) — ENTERPRISE NAVY / SLATE */}
      <aside className="hidden lg:flex flex-col w-72 fixed inset-y-0 left-0 bg-[#0f172a] border-r border-slate-800 shrink-0 z-20 shadow-sm">

        {/* Sidebar Logo — Clarveon */}
        <div className="h-20 px-6 border-b border-slate-800/80 flex items-center overflow-hidden">
          <Link href="/dashboard" className="flex items-center">
            <img
              src="/logo.png"
              alt="Clarveon"
              className="h-12 w-auto origin-left scale-[2.85] block"
            />
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 mb-3 text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
            PLATEFORME
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-slate-800/80 bg-[#090d16]">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-sm font-medium text-slate-300 transition-colors"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            <span>Déconnexion</span>
          </button>
        </div>

      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto lg:ml-72">

        {/* Top Header */}
        <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between fixed top-0 right-0 left-0 lg:left-72 z-40">

          {/* Mobile hamburger & title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Search bar */}
            <form
              onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) router.push(`/dashboard/history`); }}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 w-64 focus-within:border-slate-400 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un domaine..."
                className="bg-transparent border-0 text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-full"
              />
            </form>
          </div>

          {/* User & Notifications Controls */}
          <div className="flex items-center gap-3 relative">

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowUserDropdown(false);
                }}
                className="p-2 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-blue-600 text-[8.5px] font-bold text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 p-4 rounded-lg bg-white border border-slate-200 shadow-lg z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    <button onClick={markAllRead} className="text-[10px] text-blue-600 hover:underline font-semibold">Marquer comme lu</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-2.5 rounded-md border text-xs ${n.read ? "bg-slate-50 border-slate-100 opacity-70" : "bg-slate-50 border-slate-200"}`}>
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-slate-900">{n.title}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{n.time}</span>
                        </div>
                        <p className="text-[10.5px] text-slate-600 mt-1 leading-normal">{n.text}</p>
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
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-lg bg-white border border-slate-200 text-left hover:border-slate-300 hover:bg-slate-50/60 shadow-sm transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
                    {userCompany || userName || "..."}
                  </div>
                  {userCompany && userName && (
                    <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                      {userName}
                    </div>
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-52 p-2 rounded-lg bg-white border border-slate-200 shadow-lg z-50 space-y-0.5">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                    <span className="block text-xs font-bold text-slate-900">{userCompany || userName || "..."}</span>
                    {userCompany && userName && (
                      <span className="block text-[11px] text-slate-600 font-medium">{userName}</span>
                    )}
                    <span className="block text-[9.5px] text-slate-400 font-mono truncate">{userEmail}</span>
                  </div>
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Paramètres</span>
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Mon Profil</span>
                  </Link>
                  <button
                    onClick={() => { setShowUserDropdown(false); handleSignOut(); }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* Dashboard Pages Root */}
        <main className="flex-1 p-6 lg:p-8 mt-16">
          {children}
        </main>
      </div>

      {/* 3. MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/40 backdrop-blur-sm animate-fade-in">

          <div className="w-64 bg-[#0f172a] p-5 flex flex-col justify-between shadow-xl">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <Link href="/dashboard" className="flex items-center overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="Clarveon"
                    className="h-11 w-auto origin-left scale-[2.5] block"
                  />
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                        ? "bg-blue-600 text-white font-semibold"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                        }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-3.5 rounded-lg bg-[#090d16] border border-slate-800 flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="overflow-hidden flex-1">
                <div className="font-semibold text-white truncate text-sm">{userCompany || userName || "..."}</div>
                <div className="text-xs text-slate-400 font-mono truncate">{userEmail}</div>
              </div>
              <button onClick={handleSignOut} className="p-1.5 text-slate-400 hover:text-red-400 rounded-md shrink-0">
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}