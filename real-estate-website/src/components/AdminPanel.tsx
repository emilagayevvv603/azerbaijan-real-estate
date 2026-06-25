import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Property, User, SupportTicket } from "../types";
import { getApiUrl } from "../utils/api";
import { 
  ShieldAlert, Lock, ArrowRight, Eye, Phone, Trash2, 
  Check, X, Sparkles, RefreshCw, BarChart2, Users, 
  MessageSquare, Settings, Edit3, Heart, Building2 
} from "lucide-react";

interface AdminPanelProps {
  lang: "az" | "en" | "ru";
  listings: Property[];
  onRefreshListings: () => void;
}

export default function AdminPanel({ lang, listings, onRefreshListings }: AdminPanelProps) {
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  
  // Tab states
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "properties" | "users" | "tickets">("dashboard");
  
  // Live lists from server
  const [usersList, setUsersList] = useState<User[]>([]);
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);

  // Inline edit listing modal state
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editTitleAz, setEditTitleAz] = useState("");
  const [editAddress, setEditAddress] = useState("");

  // Ticket reply active modal
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [adminReplyMsg, setAdminReplyMsg] = useState("");

  const handleBypassLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "mydom2026" || passcode === "1234") {
      setIsAuthenticated(true);
      setAuthError("");
      fetchAdminData();
    } else {
      setAuthError(lang === "az" ? "Təhlükəsizlik bypass kodu yanlışdır!" : "Invalid admin bypass code!");
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const usersRes = await fetch(getApiUrl("/api/admin/users"));
      const ticketsRes = await fetch(getApiUrl("/api/tickets"));
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsersList(uData);
      }
      if (ticketsRes.ok) {
        const tData = await ticketsRes.json();
        setTicketsList(tData);
      }
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
    }
  }, [isAuthenticated]);

  // Handle properties administrative operations
  const handleToggleVip = async (propId: string) => {
    try {
      const res = await fetch(getApiUrl(`/api/admin/listings/${propId}/toggle-boost`), {
        method: "POST"
      });
      if (res.ok) {
        onRefreshListings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteListing = async (propId: string) => {
    if (!window.confirm(lang === "az" ? "Bu elanı silmək istədiyinizdən əminsiniz?" : "Are you sure you want to delete this listing?")) return;
    try {
      const res = await fetch(getApiUrl(`/api/admin/listings/${propId}`), {
        method: "DELETE"
      });
      if (res.ok) {
        onRefreshListings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenEditModal = (p: Property) => {
    setEditingProperty(p);
    setEditPrice(p.price.toString());
    setEditTitleAz(p.title.az);
    setEditAddress(p.address);
  };

  const handleSaveListingEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty) return;

    try {
      const res = await fetch(getApiUrl(`/api/admin/listings/${editingProperty.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: Number(editPrice),
          title: { ...editingProperty.title, az: editTitleAz },
          address: editAddress
        })
      });
      if (res.ok) {
        setEditingProperty(null);
        onRefreshListings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle users administrative operations
  const handleToggleUserVerify = async (uId: string, current: boolean) => {
    try {
      const res = await fetch(getApiUrl(`/api/admin/users/${uId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPhoneVerified: !current })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeUserRole = async (uId: string, currentRole: string) => {
    const targetRole = currentRole === "agent" ? "user" : "agent";
    try {
      const res = await fetch(getApiUrl(`/api/admin/users/${uId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (uId: string) => {
    if (!window.confirm(lang === "az" ? "Bu istifadəçi profilini sistemdən silmək istədiyinizdən əminsiniz?" : "Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(getApiUrl(`/api/admin/users/${uId}`), {
        method: "DELETE"
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Ticket Operations
  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !adminReplyMsg) return;

    try {
      const res = await fetch(getApiUrl(`/api/admin/tickets/${activeTicket.id}/reply`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: adminReplyMsg })
      });
      if (res.ok) {
        setAdminReplyMsg("");
        setActiveTicket(null);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTicket = async (tId: string) => {
    if (!window.confirm("Bileti sistemden silmek isteyirsiniz?")) return;
    try {
      const res = await fetch(getApiUrl(`/api/admin/tickets/${tId}`), {
        method: "DELETE"
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Render Lock screen if not authorized
  if (!isAuthenticated) {
    return (
      <section className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-100 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6"
        >
          <div className="h-16 w-16 bg-red-50 text-brand-red rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
            <Lock />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-brand-dark tracking-tight">
              MYDOM.AZ Məxfi İdarəetmə Portalı
            </h2>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Administration Security Gateway
            </p>
          </div>

          <form onSubmit={handleBypassLogin} className="space-y-3">
            <input
              type="password"
              placeholder="Giriş Kodunu daxil edin..."
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl text-center text-sm font-bold tracking-widest focus:outline-none focus:border-brand-red focus:bg-white transition"
              required
            />
            {authError && (
              <p className="text-[11px] text-brand-red font-bold text-center">
                {authError}
              </p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-brand-red hover:bg-red-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-red-500/10 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <span>Portala Keçid Al</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </motion.div>
      </section>
    );
  }

  // Calculate stats
  const totalViews = listings.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalLeads = listings.reduce((sum, p) => sum + (p.leads || 0), 0);
  const totalVips = listings.filter(p => p.isBoosted).length;
  const totalAgents = usersList.filter(u => u.role === "agent").length;
  const pendingTickets = ticketsList.filter(t => t.status !== "resolved").length;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-300">
      
      {/* Admin Title Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-red-50 text-brand-red px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest border border-red-100 flex items-center gap-1">
              <Sparkles size={10} /> Admin Panel
            </span>
            <span className="text-[10px] text-gray-400 font-bold tracking-wider">SECURE AUDIT CONTROL • 2026</span>
          </div>
          <h1 className="text-2xl font-black text-brand-dark tracking-tight mt-1 flex items-center gap-2">
            MYDOM.AZ Baş İdarəetmə Mərkəzi
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="p-2.5 bg-white hover:bg-gray-50 border border-gray-100 text-gray-500 rounded-2xl shadow-sm transition flex items-center gap-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Yenilə</span>
          </button>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="p-2.5 bg-red-50 hover:bg-red-100 text-brand-red border border-red-100 rounded-2xl shadow-sm transition text-xs font-bold cursor-pointer"
          >
            Sessiyanı Bitir
          </button>
        </div>
      </div>

      {/* KPI Stats Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Aktiv Elanlar</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-brand-dark font-mono">{listings.length}</span>
            <span className="text-[10px] text-gray-400 font-medium">elan</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Premium VIP Boost</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-500 font-mono">{totalVips}</span>
            <span className="text-[10px] text-gray-400 font-medium">VIP</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Ümumi Baxış (Views)</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-brand-red font-mono">{totalViews.toLocaleString()}</span>
            <span className="text-[10px] text-gray-400 font-medium">baxış</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Partnyor Agentlik</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-emerald-500 font-mono">{totalAgents}</span>
            <span className="text-[10px] text-gray-400 font-medium">şirkət</span>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">Dəstək Gözləyən</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-red-600 font-mono">{pendingTickets}</span>
            <span className="text-[10px] text-gray-400 font-medium">bilet</span>
          </div>
        </div>

      </div>

      {/* Admin Tab Controller */}
      <div className="flex border-b border-gray-100 mb-8 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveSubTab("dashboard")}
          className={`px-5 py-3 text-xs font-extrabold tracking-wider uppercase transition border-b-2 cursor-pointer ${
            activeSubTab === "dashboard"
              ? "border-brand-red text-brand-red"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          🎛️ Genəl Baxış
        </button>
        <button
          onClick={() => setActiveSubTab("properties")}
          className={`px-5 py-3 text-xs font-extrabold tracking-wider uppercase transition border-b-2 cursor-pointer ${
            activeSubTab === "properties"
              ? "border-brand-red text-brand-red"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          🏠 Elanlara Nəzarət ({listings.length})
        </button>
        <button
          onClick={() => setActiveSubTab("users")}
          className={`px-5 py-3 text-xs font-extrabold tracking-wider uppercase transition border-b-2 cursor-pointer ${
            activeSubTab === "users"
              ? "border-brand-red text-brand-red"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          👥 İstifadəçilər ({usersList.length})
        </button>
        <button
          onClick={() => setActiveSubTab("tickets")}
          className={`px-5 py-3 text-xs font-extrabold tracking-wider uppercase transition border-b-2 cursor-pointer ${
            activeSubTab === "tickets"
              ? "border-brand-red text-brand-red"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          📥 Dəstək Biletləri ({ticketsList.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">

        {/* 1. SUB-TAB: GENERAL DASHBOARD */}
        {activeSubTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Quick Metrics */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-base font-extrabold text-brand-dark flex items-center gap-1.5">
                  <BarChart2 className="text-brand-red" size={18} />
                  <span>Sistem Analitikası və Aktivlik xülasəsi</span>
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                  Portal daxilində yerləşdirilən elanların ümumi göstəriciləri, müştəri müraciətlərinin (leads) statistikası və sistemin təhlükəsizlik statusunun monitorinqi.
                </p>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-50">
                  <div className="text-center p-3 bg-red-50/50 rounded-2xl border border-red-50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Klik Oranı (CTR)</span>
                    <span className="block text-lg font-black text-brand-red font-mono mt-1">
                      {totalViews ? ((totalLeads / totalViews) * 100).toFixed(1) : "0"}%
                    </span>
                  </div>
                  <div className="text-center p-3 bg-red-50/50 rounded-2xl border border-red-50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">VIP Nisbəti</span>
                    <span className="block text-lg font-black text-amber-600 font-mono mt-1">
                      {listings.length ? ((totalVips / listings.length) * 100).toFixed(0) : "0"}%
                    </span>
                  </div>
                  <div className="text-center p-3 bg-red-50/50 rounded-2xl border border-red-50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Həll Nisbəti</span>
                    <span className="block text-lg font-black text-emerald-600 font-mono mt-1">
                      {ticketsList.length ? (((ticketsList.length - pendingTickets) / ticketsList.length) * 100).toFixed(0) : "0"}%
                    </span>
                  </div>
                </div>
              </div>

              {/* VIP Properties List */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-extrabold text-brand-dark flex items-center gap-1.5">
                    <Sparkles className="text-amber-500" size={16} />
                    <span>Sistemdəki VIP Boost Alan Elanlar</span>
                  </h3>
                  <span className="text-[10px] text-gray-400 font-extrabold">{totalVips} VIP</span>
                </div>

                <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                  {listings.filter(p => p.isBoosted).length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">Hal-hazırda heç bir VIP elan mövcud deyil.</p>
                  ) : (
                    listings.filter(p => p.isBoosted).map(p => (
                      <div key={p.id} className="py-3 flex justify-between items-center gap-4">
                        <div className="flex items-center gap-3 truncate">
                          <img src={p.images[0]} className="h-10 w-10 object-cover rounded-lg shadow-sm" alt="Thumbnail" />
                          <div className="truncate">
                            <span className="block text-xs font-extrabold text-brand-dark truncate">{p.title.az}</span>
                            <span className="block text-[9px] text-gray-400">{p.price.toLocaleString()} AZN • {p.address}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleVip(p.id)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-extrabold rounded-lg border border-amber-100 cursor-pointer shrink-0"
                        >
                          VIP Ləğv Et
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Quick Audit Sidebar */}
            <div className="space-y-6">
              <div className="bg-brand-dark text-white rounded-3xl p-6 shadow-lg space-y-4">
                <h3 className="text-sm font-extrabold tracking-wider uppercase text-red-500">
                  Təhlükəsizlik jurnalı
                </h3>
                <div className="space-y-3 pt-2 text-xs font-semibold text-gray-300">
                  <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                    <span>Server Statusu:</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" /> AKTİV
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                    <span>Verilənlər Bazası:</span>
                    <span className="font-mono text-[10px]">db.json LOCAL FILE</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                    <span>Admin Keçidi:</span>
                    <span className="text-emerald-400">TƏSDİQLƏNDİ</span>
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Mühüm bildiriş</h4>
                  <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                    Sistem üzərində edilən hər bir dəyişiklik verilənlər bazasında dərhal qeyd olunur. Elanların və hesabların koordinasiyası zamanı diqqətli olmağınız xahiş olunur.
                  </p>
                </div>
              </div>

              {/* Dynamic Tickets overview */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-extrabold text-brand-dark flex items-center gap-1.5">
                  <MessageSquare size={16} className="text-brand-red" />
                  <span>Son Dəstək Sorğuları</span>
                </h3>
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {ticketsList.slice(0, 3).map(t => (
                    <div key={t.id} className="p-3 bg-gray-50 rounded-xl space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-brand-dark truncate max-w-[120px]">{t.userName}</span>
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          t.status === "open" ? "bg-red-50 text-brand-red border border-red-100" :
                          t.status === "in_progress" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                          "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}>{t.status}</span>
                      </div>
                      <p className="text-[11px] font-bold text-gray-700 leading-tight">{t.subject}</p>
                      <button
                        onClick={() => { setActiveTicket(t); setActiveSubTab("tickets"); }}
                        className="text-[9px] text-brand-red hover:underline font-bold mt-1 block"
                      >
                        Bileti Cavabla
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 2. SUB-TAB: PROPERTIES CONTROL */}
        {activeSubTab === "properties" && (
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-brand-dark">Sistemdəki mövcud elanların siyahısı</h3>
              <span className="text-xs text-gray-400 font-extrabold">{listings.length} elan tapıldı</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-4">Elan mətni</th>
                    <th className="py-4 px-4 text-center">Qiymət (AZN)</th>
                    <th className="py-4 px-4 text-center">Baxış / Zəng</th>
                    <th className="py-4 px-4 text-center">VIP Status</th>
                    <th className="py-4 px-4 text-right">Əməliyyatlar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {listings.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-4 px-4 max-w-xs">
                        <div className="flex items-center gap-3">
                          <img src={p.images[0]} className="h-10 w-10 object-cover rounded-lg shrink-0" alt="Thumb" />
                          <div className="truncate">
                            <span className="block font-extrabold text-brand-dark truncate">{p.title.az}</span>
                            <span className="block text-[10px] text-gray-400 font-medium truncate">{p.address} • {p.area} m²</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-brand-red font-mono">
                        {p.price.toLocaleString()} AZN
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex flex-col items-center justify-center font-mono text-[10px] text-gray-500">
                          <span>👀 {p.views || 0}</span>
                          <span>📞 {p.leads || 0}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-1 rounded-full ${
                          p.isBoosted 
                            ? "bg-amber-50 text-amber-600 border border-amber-100"
                            : "bg-gray-50 text-gray-400 border border-gray-100"
                        }`}>
                          {p.isBoosted ? "★ VIP AKTİV" : "Yoxdur"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleVip(p.id)}
                            className={`p-1.5 rounded-lg border cursor-pointer transition ${
                              p.isBoosted 
                                ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100" 
                                : "bg-gray-50 border-gray-100 text-gray-400 hover:text-amber-500 hover:bg-amber-50"
                            }`}
                            title="VIP statusunu dəyiş"
                          >
                            <Sparkles size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-lg border border-gray-100 cursor-pointer transition"
                            title="Elanı redaktə et"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteListing(p.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-brand-red rounded-lg border border-red-100 cursor-pointer transition"
                            title="Elanı sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. SUB-TAB: USERS LIST CONTROL */}
        {activeSubTab === "users" && (
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-base font-extrabold text-brand-dark">Qeydiyyatdan Keçmiş İstifadəçi Portfeli</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-4">Ad Soyad / E-poçt</th>
                    <th className="py-4 px-4">Əlaqə nömrəsi</th>
                    <th className="py-4 px-4 text-center">Sistem Rolu</th>
                    <th className="py-4 px-4 text-center">Hesab statusu</th>
                    <th className="py-4 px-4 text-right">Əməliyyat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-brand-dark">{u.fullName}</div>
                        <div className="text-[10px] text-gray-400 font-medium">{u.email}</div>
                      </td>
                      <td className="py-4 px-4 font-mono text-[11px] text-gray-600">
                        {u.phone || "Qeyd olunmayıb"}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          u.role === "admin" ? "bg-red-50 text-brand-red border border-red-100" :
                          u.role === "agent" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                          "bg-gray-50 text-gray-500 border border-gray-100"
                        }`}>
                          {u.role === "agent" ? "★ Partnyor Agentlik" : u.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleUserVerify(u.id, u.isPhoneVerified)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase border cursor-pointer transition ${
                            u.isPhoneVerified 
                              ? "bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100"
                              : "bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100"
                          }`}
                        >
                          {u.isPhoneVerified ? "Təsdiqlənib" : "Təsdiq Gözləyir"}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleChangeUserRole(u.id, u.role)}
                            className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 text-[10px] font-extrabold rounded-lg border border-gray-100 cursor-pointer transition"
                          >
                            Rolunu Dəyiş
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-brand-red rounded-lg border border-red-100 cursor-pointer transition"
                            title="Hesabı Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. SUB-TAB: DESTEK BILETLERI */}
        {activeSubTab === "tickets" && (
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-base font-extrabold text-brand-dark">Gələn Dəstək Sorğularının Kooperasiyası</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Left Column: Tickets list */}
              <div className="md:col-span-1 border border-gray-100 rounded-2xl p-4 space-y-3 divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pb-2">Bilet Siyahısı</span>
                {ticketsList.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">Heç bir sorğu daxil olmayıb.</p>
                ) : (
                  ticketsList.map(t => (
                    <div
                      key={t.id}
                      onClick={() => { setActiveTicket(t); setAdminReplyMsg(""); }}
                      className={`p-3 rounded-xl cursor-pointer transition space-y-1.5 ${
                        activeTicket?.id === t.id 
                          ? "bg-red-50 border border-red-100" 
                          : "hover:bg-gray-50/50"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-extrabold text-brand-dark truncate max-w-[150px]">{t.userName}</span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                          t.status === "open" ? "bg-red-100 text-brand-red" :
                          t.status === "in_progress" ? "bg-amber-100 text-amber-700" :
                          "bg-emerald-100 text-emerald-700"
                        }`}>{t.status}</span>
                      </div>
                      <h4 className="text-xs font-extrabold text-gray-700 leading-tight line-clamp-1">{t.subject}</h4>
                      <p className="text-[10px] text-gray-400 truncate">{t.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Right Column: Ticket Conversation Details */}
              <div className="md:col-span-2 bg-gray-50/50 border border-gray-100 rounded-2xl p-6 flex flex-col justify-between min-h-[400px]">
                {activeTicket ? (
                  <div className="flex flex-col justify-between h-full space-y-6">
                    <div>
                      {/* Ticket Header */}
                      <div className="border-b border-gray-100 pb-4 flex justify-between items-start gap-4">
                        <div>
                          <span className="bg-red-50 text-brand-red text-[8px] font-extrabold px-2 py-0.5 rounded border border-red-100 uppercase">{activeTicket.category}</span>
                          <h3 className="text-sm font-black text-brand-dark mt-1">{activeTicket.subject}</h3>
                          <span className="text-[10px] text-gray-400 font-semibold mt-0.5 block">{activeTicket.userName} ({activeTicket.userEmail})</span>
                        </div>
                        <button
                          onClick={() => handleDeleteTicket(activeTicket.id)}
                          className="p-1.5 bg-red-100/60 hover:bg-red-100 text-brand-red rounded-xl transition cursor-pointer"
                          title="Bileti Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Chat log */}
                      <div className="space-y-4 pt-4 max-h-[250px] overflow-y-auto">
                        {activeTicket.replies.map((rep, index) => (
                          <div 
                            key={index} 
                            className={`flex flex-col max-w-[80%] ${
                              rep.sender === "support" ? "ml-auto items-end" : "mr-auto items-start"
                            }`}
                          >
                            <span className="text-[9px] text-gray-400 font-bold mb-1 uppercase">
                              {rep.sender === "support" ? "Dəstək Operatoru" : activeTicket.userName}
                            </span>
                            <div className={`p-3 rounded-2xl text-xs font-semibold shadow-sm leading-relaxed ${
                              rep.sender === "support" 
                                ? "bg-brand-red text-white rounded-tr-none" 
                                : "bg-white text-gray-700 border border-gray-100 rounded-tl-none"
                            }`}>
                              {rep.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Admin response typing form */}
                    <form onSubmit={handleReplyTicket} className="border-t border-gray-100 pt-4 space-y-3">
                      <textarea
                        placeholder="Rəsmi cavabınızı daxil edin..."
                        value={adminReplyMsg}
                        onChange={(e) => setAdminReplyMsg(e.target.value)}
                        className="w-full p-3 bg-white border border-gray-100 rounded-2xl text-xs font-medium focus:outline-none focus:border-brand-red min-h-[70px] shadow-inner"
                        required
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-brand-red hover:bg-red-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-red-500/10 cursor-pointer transition"
                        >
                          Rəsmi Cavabı Göndər (Status: Resolved)
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="text-center py-20 flex flex-col items-center justify-center space-y-2">
                    <MessageSquare size={44} className="text-gray-300" />
                    <h4 className="font-bold text-gray-800 text-sm">Bilet Seçilməyib</h4>
                    <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed">
                      Zəhmət olmasa, ətraflı baxmaq, müştəriyə operator adından cavab vermək və bilet statusunu tənzimləmək üçün sol siyahıdan bilet seçin.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* INLINE PROPERTY EDIT MODAL */}
      <AnimatePresence>
        {editingProperty && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-100 shadow-2xl space-y-4"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-brand-dark text-sm">Elanın Redaktəsi (Admin)</h3>
                <button onClick={() => setEditingProperty(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveListingEdit} className="space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Başlıq (AZ)
                  </label>
                  <input
                    type="text"
                    value={editTitleAz}
                    onChange={(e) => setEditTitleAz(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-red focus:bg-white transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Ünvan (Azerbaijan)
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-red focus:bg-white transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Qiymət (AZN)
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-red focus:bg-white transition text-center"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingProperty(null)}
                    className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Ləğv Et
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-brand-red hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer"
                  >
                    Yadda saxla
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}
