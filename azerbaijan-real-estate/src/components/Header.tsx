import React, { useState, useEffect, useRef } from "react";
import { TRANSLATIONS } from "../data/translations";
import { User } from "../types";
import { Home, Heart, History, ShieldAlert, LogIn, LogOut, UserCircle, MessageSquarePlus, ChevronDown, Menu, X, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HeaderProps {
  lang: "az" | "en" | "ru";
  setLang: (l: "az" | "en" | "ru") => void;
  user: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  activeTab: "explore" | "favorites" | "history" | "dashboard" | "tickets" | "admin";
  setActiveTab: (t: "explore" | "favorites" | "history" | "dashboard" | "tickets" | "admin") => void;
}

const FlagIcon = ({ lang }: { lang: "az" | "en" | "ru" }) => {
  if (lang === "az") {
    return (
      <span className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-gray-200/80 flex items-center justify-center relative shadow-sm">
        <svg viewBox="0 0 24 24" className="w-full h-full">
          <rect x="0" y="0" width="24" height="8" fill="#00B5E2" />
          <rect x="0" y="8" width="24" height="8" fill="#EF3340" />
          <rect x="0" y="16" width="24" height="8" fill="#50B848" />
          {/* Crescent and 8-pointed star in the red stripe */}
          <circle cx="11.5" cy="12" r="2.2" fill="white" />
          <circle cx="12.3" cy="12" r="1.8" fill="#EF3340" />
          <polygon points="14.2,12 13.5,12.3 13.7,13.1 13.1,12.5 12.5,13.1 12.7,12.3 12,12 12.7,11.7 12.5,10.9 13.1,11.5 13.7,10.9 13.5,11.7" fill="white" />
        </svg>
      </span>
    );
  }
  if (lang === "en") {
    return (
      <span className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-gray-200/80 flex items-center justify-center relative shadow-sm">
        <svg viewBox="0 0 24 24" className="w-full h-full bg-[#012169]">
          {/* White diagonal saltire */}
          <line x1="0" y1="0" x2="24" y2="24" stroke="white" strokeWidth="2.5" />
          <line x1="24" y1="0" x2="0" y2="24" stroke="white" strokeWidth="2.5" />
          {/* Red diagonal saltire */}
          <line x1="0" y1="0" x2="24" y2="24" stroke="#C8102E" strokeWidth="1" />
          <line x1="24" y1="0" x2="0" y2="24" stroke="#C8102E" strokeWidth="1" />
          {/* White cross */}
          <line x1="12" y1="0" x2="12" y2="24" stroke="white" strokeWidth="4" />
          <line x1="0" y1="12" x2="24" y2="12" stroke="white" strokeWidth="4" />
          {/* Red cross */}
          <line x1="12" y1="0" x2="12" y2="24" stroke="#C8102E" strokeWidth="2" />
          <line x1="0" y1="12" x2="24" y2="12" stroke="#C8102E" strokeWidth="2" />
        </svg>
      </span>
    );
  }
  return (
    <span className="w-5 h-5 rounded-full overflow-hidden shrink-0 border border-gray-200/80 flex items-center justify-center relative shadow-sm">
      <svg viewBox="0 0 24 24" className="w-full h-full">
        <rect x="0" y="0" width="24" height="8" fill="#FFFFFF" />
        <rect x="0" y="8" width="24" height="8" fill="#0039A6" />
        <rect x="0" y="16" width="24" height="8" fill="#D52B1E" />
      </svg>
    </span>
  );
};

export default function Header({
  lang,
  setLang,
  user,
  onOpenLogin,
  onLogout,
  activeTab,
  setActiveTab,
}: HeaderProps) {
  const t = TRANSLATIONS[lang];
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header id="app-header" className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("explore")}>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-red to-red-800 flex items-center justify-center text-white font-extrabold text-2xl shadow-md transform hover:scale-105 transition">
              M
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-brand-dark tracking-tight">MYDOM<span className="text-brand-red">.AZ</span></span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => setActiveTab("explore")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "explore"
                  ? "bg-red-50 text-brand-red"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Home size={16} />
              {lang === "az" ? "Elanlar" : lang === "en" ? "Explore" : "Объявления"}
            </button>

            {user && (
              <>
                <button
                  onClick={() => setActiveTab("favorites")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === "favorites"
                      ? "bg-red-50 text-brand-red"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Heart size={16} />
                  {t.favoritesTitle.split(" ")[0]}
                </button>

                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === "history"
                      ? "bg-red-50 text-brand-red"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <History size={16} />
                  {t.historyTitle.split(" ")[0]}
                </button>

                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === "dashboard"
                      ? "bg-red-50 text-brand-red"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <UserCircle size={16} />
                  {t.dashboardBtn}
                </button>

                <button
                  onClick={() => setActiveTab("tickets")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    activeTab === "tickets"
                      ? "bg-red-50 text-brand-red"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <ShieldAlert size={16} />
                  {lang === "az" ? "Dəstək" : lang === "en" ? "Support" : "Поддержка"}
                </button>

                {user.role === "admin" && (
                  <button
                    onClick={() => setActiveTab("admin")}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      activeTab === "admin"
                        ? "bg-red-50 text-brand-red"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Lock size={16} />
                    <span>Admin Panel</span>
                  </button>
                )}
              </>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            
            {/* Language dropdown switcher - Flag-only & Animated */}
            <div className="relative" ref={dropdownRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 p-1.5 sm:p-2 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-red/20 cursor-pointer transition shadow-sm"
              >
                <FlagIcon lang={lang} />
                <ChevronDown size={12} className={`text-gray-400 transition-transform duration-300 ${langOpen ? "rotate-180" : ""}`} />
              </motion.button>

              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute right-0 mt-1.5 w-10 bg-white border border-gray-100 rounded-xl shadow-xl py-1 z-50 flex flex-col items-center gap-0.5"
                  >
                    {(["az", "en", "ru"] as const).map((l) => {
                      if (l === lang) return null;
                      return (
                        <motion.button
                          key={l}
                          whileHover={{ scale: 1.1, backgroundColor: "#f3f4f6" }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setLang(l);
                            setLangOpen(false);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer"
                        >
                          <FlagIcon lang={l} />
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Authentication state */}
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-sm font-bold text-gray-800">{user.fullName}</span>
                  <span className="text-[10px] text-brand-red font-semibold bg-red-50 px-1.5 py-0.5 rounded uppercase self-end">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-brand-red border border-gray-200 hover:border-red-100 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">{t.logoutBtn}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 bg-brand-red hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer"
              >
                <LogIn size={16} />
                <span>{t.loginBtn}</span>
              </button>
            )}

            {/* Hamburger Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex md:hidden p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-brand-dark transition focus:outline-none cursor-pointer shadow-sm border border-gray-200"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

          </div>

        </div>

        {/* Mobile Hamburger Drawer Navigation menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="md:hidden overflow-hidden border-t border-gray-100 bg-white"
            >
              <div className="py-4 space-y-1.5 flex flex-col">
                <button
                  onClick={() => {
                    setActiveTab("explore");
                    setMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                    activeTab === "explore" 
                      ? "bg-red-50 text-brand-red font-extrabold" 
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Home size={16} />
                  <span>{lang === "az" ? "Elanlar" : lang === "en" ? "Explore" : "Объявления"}</span>
                </button>

                {user && (
                  <>
                    <button
                      onClick={() => {
                        setActiveTab("favorites");
                        setMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                        activeTab === "favorites" 
                          ? "bg-red-50 text-brand-red font-extrabold" 
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Heart size={16} />
                      <span>{t.favoritesTitle}</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("history");
                        setMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                        activeTab === "history" 
                          ? "bg-red-50 text-brand-red font-extrabold" 
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <History size={16} />
                      <span>{t.historyTitle}</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("dashboard");
                        setMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                        activeTab === "dashboard" 
                          ? "bg-red-50 text-brand-red font-extrabold" 
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <UserCircle size={16} />
                      <span>{t.dashboardBtn}</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("tickets");
                        setMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                        activeTab === "tickets" 
                          ? "bg-red-50 text-brand-red font-extrabold" 
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <ShieldAlert size={16} />
                      <span>{lang === "az" ? "Dəstək" : lang === "en" ? "Support" : "Поддержка"}</span>
                    </button>
                  </>
                )}

                {user?.role === "admin" && (
                  <button
                    onClick={() => {
                      setActiveTab("admin");
                      setMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
                      activeTab === "admin" 
                        ? "bg-red-50 text-brand-red font-extrabold" 
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Lock size={16} />
                    <span>Admin Panel</span>
                  </button>
                )}

                {!user && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        onOpenLogin();
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-brand-red hover:bg-red-700 text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition"
                    >
                      <LogIn size={16} />
                      <span>{t.loginBtn}</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </header>
  );
}
