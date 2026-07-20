"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Shield, 
  LayoutDashboard, 
  Activity, 
  Sliders, 
  TrendingUp, 
  History, 
  CreditCard, 
  Settings, 
  HelpCircle, 
  Bell, 
  Menu, 
  X, 
  User, 
  LogOut,
  ChevronDown,
  Lock
} from "lucide-react";

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Nav items list
  const navItems = [
    { name: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
    { name: "Lancer un Scan", href: "/dashboard/scan", icon: Activity },
    { name: "Outils de Sécurité", href: "/dashboard/tools", icon: Sliders },
    { name: "Historique", href: "/dashboard/history", icon: History },
    { name: "Comparateur", href: "/dashboard/compare", icon: TrendingUp },
    { name: "Abonnement & Offres", href: "/dashboard/billing", icon: CreditCard },
    { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
    { name: "Centre d'Aide", href: "/dashboard/help", icon: HelpCircle },
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* 1. SIDEBAR (DESKTOP) */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-neutral-900 bg-neutral-950 shrink-0">
        
        {/* Sidebar Logo */}
        <div className="h-20 px-6 border-b border-neutral-900 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">Cybelis</span>
              <span className="text-[9px] block font-mono text-indigo-400">DASHBOARD</span>
            </div>
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <div className="px-3 mb-2 text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
            Audit SaaS
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive 
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 border-r-2 border-white" 
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-neutral-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-neutral-900 bg-neutral-950/80">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-neutral-900/50 border border-neutral-800">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-xs text-indigo-400">
              HBS
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">Amina & Kenza</div>
              <div className="text-[9px] text-neutral-500 font-mono">Stage MVP v2</div>
            </div>
          </div>
        </div>

      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header */}
        <header className="h-20 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
          
          {/* Mobile hamburger & title */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <h2 className="text-sm font-bold text-white">Espace Cybelis Scan Engine</h2>
              <p className="text-[10px] text-neutral-500">Statut de la plateforme : <span className="text-emerald-400 font-semibold font-mono">ONLINE</span></p>
            </div>
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
                className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-indigo-600 border border-neutral-950 text-[9px] font-bold text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 p-4 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                    <span className="text-xs font-bold text-white">Notifications</span>
                    <button onClick={markAllRead} className="text-[10px] text-indigo-400 hover:underline">Marquer comme lu</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-2.5 rounded-xl border text-xs ${n.read ? "bg-neutral-900 border-neutral-800/40 opacity-70" : "bg-indigo-500/5 border-indigo-500/10"}`}>
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-white">{n.title}</span>
                          <span className="text-[9px] text-neutral-500 font-mono">{n.time}</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-1 leading-normal">{n.text}</p>
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
                className="flex items-center gap-2 p-1.5 pr-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-left hover:border-neutral-700 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                  AM
                </div>
                <div className="hidden md:block">
                  <div className="text-xs font-bold text-white truncate max-w-[100px]">Amina Marzak</div>
                </div>
                <ChevronDown className="w-3 h-3 text-neutral-500" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-3 w-52 p-3 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl z-50 space-y-1">
                  <div className="px-2 py-1.5 border-b border-neutral-800 mb-1.5">
                    <span className="block text-xs font-bold text-white">Amina Marzak</span>
                    <span className="block text-[9px] text-neutral-500 font-mono truncate">amina.marzak@cybelis.ma</span>
                  </div>
                  <Link 
                    href="/dashboard/settings" 
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Mon Profil</span>
                  </Link>
                  <Link 
                    href="/dashboard/billing" 
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Abonnement</span>
                  </Link>
                  <Link 
                    href="/login" 
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors border-t border-neutral-800 mt-1.5"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </Link>
                </div>
              )}
            </div>

          </div>

        </header>

        {/* Dashboard Pages Root */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* 3. MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-neutral-950/80 backdrop-blur-sm animate-fade-in">
          
          <div className="w-64 bg-neutral-950 border-r border-neutral-900 p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-white text-base">Cybelis</span>
                </Link>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400"
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
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive 
                          ? "bg-indigo-600 text-white shadow-lg" 
                          : "text-neutral-400 hover:text-white hover:bg-neutral-900/60"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-2.5 text-xs text-neutral-400">
              <div className="w-7 h-7 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">
                AM
              </div>
              <div>
                <div className="font-bold text-white">Amina Marzak</div>
                <div className="text-[10px] text-neutral-500 font-mono">Développeur</div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
