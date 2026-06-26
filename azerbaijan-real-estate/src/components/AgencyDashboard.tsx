import React, { useState, useEffect, useRef } from "react";
import { TRANSLATIONS } from "../data/translations";
import { AZERBAIJAN_CITIES } from "../data/azerbaijanCities";
import { Property, SupportTicket, User } from "../types";
import { PlusCircle, TrendingUp, HelpCircle, Activity, MessageSquare, Plus, CheckCircle, ShieldAlert, Coins, Trash2 } from "lucide-react";
import AnimatedSelect from "./AnimatedSelect";
import { getApiUrl } from "../utils/api";

interface AgencyDashboardProps {
  lang: "az" | "en" | "ru";
  token: string | null;
  user: User;
  agentId: string;
  properties: Property[];
  onPropertyCreated: () => void;
  onOpenBoost: (p: Property) => void;
}

export default function AgencyDashboard({
  lang,
  token,
  user,
  agentId,
  properties,
  onPropertyCreated,
  onOpenBoost,
}: AgencyDashboardProps) {
  const t = TRANSLATIONS[lang];
  const [activeSubTab, setActiveSubTab] = useState<"listings" | "analytics" | "tickets">("listings");
  
  // Create Listing state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [titleAz, setTitleAz] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleRu, setTitleRu] = useState("");
  const [descAz, setDescAz] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descRu, setDescRu] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState<"sell" | "rent" | "exchange">("rent");
  const [rentInterval, setRentInterval] = useState<"hourly" | "daily" | "weekly" | "monthly">("monthly");
  const [city, setCity] = useState("baku");
  const [address, setAddress] = useState("");
  const [propType, setPropType] = useState<any>("apartment_new");
  const [bedrooms, setBedrooms] = useState("2");
  const [bathrooms, setBathrooms] = useState("1");
  const [area, setArea] = useState("85");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Tickets state
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState<any>("tech_issue");
  const [ticketMessage, setTicketMessage] = useState("");
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [ticketReply, setTicketReply] = useState("");

  // Load Tickets
  const fetchTickets = async () => {
    try {
      const res = await fetch(getApiUrl("/api/tickets"), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [token]);

  // Drag and drop image handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setUploadedImages((prev) => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!titleAz || !price || !address) {
      setError(lang === "az" ? "Lütfən vacib xanaları doldurun (Başlıq, Qiymət, Ünvan)." : "Please fill in title, price, and address.");
      return;
    }

    setLoading(true);
    try {
      const body = {
        title: { az: titleAz, en: titleEn || titleAz, ru: titleRu || titleAz },
        description: { az: descAz, en: descEn || descAz, ru: descRu || descAz },
        price: Number(price),
        type,
        rentInterval: type === "rent" ? rentInterval : undefined,
        city,
        address,
        propertyType: propType,
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        area: Number(area),
        images: uploadedImages.length > 0 
          ? uploadedImages 
          : (imageUrl ? [imageUrl] : ["https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"]),
        agentId,
      };

      const res = await fetch(getApiUrl("/api/listings"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSuccess(t.createListingSuccess);
        // Clear Form
        setTitleAz(""); setTitleEn(""); setTitleRu("");
        setDescAz(""); setDescEn(""); setDescRu("");
        setPrice(""); setAddress("");
        setImageUrl(""); setUploadedImages([]);
        setShowCreateForm(false);
        onPropertyCreated();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to publish listing");
      }
    } catch (err) {
      setError("Server error while listing property.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    try {
      const res = await fetch(getApiUrl("/api/tickets"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userEmail: "agent@mydom.az",
          userName: "MyDom Certified Agency",
          subject: ticketSubject,
          message: ticketMessage,
          category: ticketCategory,
        }),
      });
      if (res.ok) {
        setTicketSubject("");
        setTicketMessage("");
        setShowCreateTicket(false);
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !ticketReply) return;
    try {
      const res = await fetch(getApiUrl(`/api/tickets/${activeTicket.id}/reply`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender: "user", message: ticketReply }),
      });
      if (res.ok) {
        setTicketReply("");
        fetchTickets();
        const updated = await res.json();
        setActiveTicket(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Compute stats
  const totalViews = properties.reduce((acc, p) => acc + (p.views || 0), 0);
  const totalLeads = properties.reduce((acc, p) => acc + (p.leads || 0), 0);
  const boostedCount = properties.filter((p) => p.isBoosted).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Dashboard Header Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="md:col-span-2 bg-gradient-to-r from-brand-red via-red-700 to-slate-900 rounded-3xl p-6 text-white shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-black">{lang === "az" ? "Tərəfdaş İdarəetmə Portalı" : "Agency Partner Portal"}</h2>
            <p className="text-xs text-white/80 mt-1 font-medium">
              {lang === "az" ? "Real vaxt rejimində elanları tənzimləyin və analitikanı izləyin." : "Manage your real estate listings and inspect leads metrics."}
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <span className="h-2.5 w-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-300">
              {lang === "az" ? "SİSTEM AKTİVDİR • 2026" : "SYSTEM ONLINE • 2026"}
            </span>
          </div>
        </div>

        {/* Total Views card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-red-50 text-brand-red rounded-2xl flex items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.viewsMetric}</div>
            <div className="text-2xl font-extrabold text-gray-800 font-mono mt-0.5">{totalViews}</div>
          </div>
        </div>

        {/* Direct Contacts card */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center">
            <MessageSquare size={24} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.leadsMetric}</div>
            <div className="text-2xl font-extrabold text-gray-800 font-mono mt-0.5">{totalLeads}</div>
          </div>
        </div>
      </div>

      {/* Sub Tabs Toggle */}
      <div className="flex border-b border-gray-100 mb-8 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveSubTab("listings")}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition ${
            activeSubTab === "listings"
              ? "border-brand-red text-brand-red"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          {lang === "az" ? "Mənim Elanlarım" : "My Listings"}
        </button>
        <button
          onClick={() => setActiveSubTab("analytics")}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition ${
            activeSubTab === "analytics"
              ? "border-brand-red text-brand-red"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          {lang === "az" ? "Real-Zamanlı Analitika" : "Real-time Analytics"}
        </button>
        <button
          onClick={() => setActiveSubTab("tickets")}
          className={`pb-4 px-6 text-sm font-bold border-b-2 transition ${
            activeSubTab === "tickets"
              ? "border-brand-red text-brand-red"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          {t.ticketsTitle} ({tickets.length})
        </button>
      </div>

      {/* 1. PROPERTY LISTINGS SUB-TAB */}
      {activeSubTab === "listings" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-brand-dark">
              {lang === "az" ? "Elanların Siyahısı" : "Properties List"}
            </h3>
            <button
              onClick={() => {
                if (!user.isPhoneVerified) {
                  alert(lang === "az" ? "Elan yerləşdirmək üçün profilinizdə nömrənizi təsdiq etməlisiniz." : "You must verify your phone number to post listings.");
                  return;
                }
                setShowCreateForm(!showCreateForm);
              }}
              className="flex items-center gap-1.5 bg-brand-red hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow"
            >
              <PlusCircle size={14} />
              <span>{lang === "az" ? "Elan Əlavə Et" : "Add Listing"}</span>
            </button>
          </div>

          {/* Form Create Listing */}
          {showCreateForm && (
            <form onSubmit={handleCreateProperty} className="bg-white border-2 border-brand-red/10 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 max-w-3xl animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h4 className="text-base font-extrabold text-brand-dark flex items-center gap-2">
                  <Plus className="text-brand-red" />
                  <span>{t.newPropertyTitle}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  ✕ {lang === "az" ? "Bağla" : "Close"}
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border-l-4 border-brand-red text-brand-red text-xs font-bold rounded-r">
                  {error}
                </div>
              )}

              {/* Azerbaijani Title field (Compulsory) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {t.fieldTitle} (AZ) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Məs. Bakıda 3 otaqlı villa"
                    value={titleAz}
                    onChange={(e) => setTitleAz(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-red focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {t.fieldTitle} (EN)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3-bedroom villa in Baku"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-red focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {t.fieldTitle} (RU)
                  </label>
                  <input
                    type="text"
                    placeholder="напр. 3-комнатная вилла в Баку"
                    value={titleRu}
                    onChange={(e) => setTitleRu(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-red focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Transactions Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AnimatedSelect
                  label={t.filterType}
                  value={type}
                  onChange={(val) => setType(val as any)}
                  options={[
                    { value: "sell", label: "💰 " + t.sell },
                    { value: "rent", label: "🔑 " + t.rent },
                    { value: "exchange", label: "🔁 " + t.exchange },
                  ]}
                />

                {type === "rent" && (
                  <AnimatedSelect
                    label={t.rentInterval}
                    value={rentInterval}
                    onChange={(val) => setRentInterval(val as any)}
                    options={[
                      { value: "hourly", label: "⏱️ " + t.hourly },
                      { value: "daily", label: "📆 " + t.daily },
                      { value: "weekly", label: "🗓️ " + t.weekly },
                      { value: "monthly", label: "🏢 " + t.monthly },
                    ]}
                  />
                )}

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {t.fieldPrice} (AZN) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-red focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Specifications: City, Rooms, Space */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <AnimatedSelect
                  label={t.filterCity}
                  value={city}
                  onChange={setCity}
                  options={AZERBAIJAN_CITIES.map((c) => ({
                    value: c.id,
                    label: "📍 " + c.name[lang],
                  }))}
                />

                <AnimatedSelect
                  label={t.filterPropType}
                  value={propType}
                  onChange={(val) => setPropType(val as any)}
                  options={[
                    { value: "apartment_new", label: "🏢 " + t.apartment_new },
                    { value: "apartment_old", label: "🏬 " + t.apartment_old },
                    { value: "villa", label: "🏡 " + t.villa },
                    { value: "office", label: "💼 " + t.office },
                    { value: "land", label: "🗺️ " + t.land },
                    { value: "commercial", label: "🏦 " + t.commercial },
                  ]}
                />

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {t.bedrooms}
                  </label>
                  <input
                    type="number"
                    value={bedrooms}
                    onChange={(e) => setBedrooms(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-red focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {t.area} (m²)
                  </label>
                  <input
                    type="number"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-red focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Exact Address */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {t.fieldAddress} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nizami küçəsi, Bakı, Azerbaijan"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-red focus:bg-white transition"
                />
              </div>

              {/* Detailed description in Azerbaijani */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {t.fieldDesc} (AZ)
                </label>
                <textarea
                  value={descAz}
                  onChange={(e) => setDescAz(e.target.value)}
                  placeholder="Əmlak haqqında ətraflı məlumat..."
                  className="w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-red focus:bg-white transition h-20"
                />
              </div>

              {/* Optional Image Url & Drag and Drop Section */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {lang === "az" ? "Məhsul Şəkilləri" : "Property Pictures"} *
                  </label>
                  <span className="text-[10px] text-brand-red font-bold">
                    {uploadedImages.length} {lang === "az" ? "şəkil yüklənib" : "images uploaded"}
                  </span>
                </div>

                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition relative ${
                    dragActive 
                      ? "border-brand-red bg-red-50/20" 
                      : "border-gray-200 bg-gray-50/50 hover:bg-gray-100/50"
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="space-y-1.5 pointer-events-none">
                    <span className="text-2xl block">📸</span>
                    <p className="text-xs font-bold text-gray-700">
                      {lang === "az" ? "Şəkilləri bura sürükləyin və ya seçmək üçün klikləyin" : "Drag and drop pictures here, or click to select"}
                    </p>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      PNG, JPG, WEBP formats (Max 10MB)
                    </p>
                  </div>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 pt-1">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                        <img src={img} className="w-full h-full object-cover" alt="Preview" />
                        <button
                          type="button"
                          onClick={() => setUploadedImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white cursor-pointer z-20"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {lang === "az" ? "VƏ YA Şəkil URL-i (İstəyə bağlı)" : "OR Image URL (Optional)"}
                  </label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-red focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition"
                >
                  {lang === "az" ? "Ləğv et" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-brand-red hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow transition disabled:opacity-50"
                >
                  {loading ? "..." : t.createBtn}
                </button>
              </div>
            </form>
          )}

          {/* Listings Table Layout */}
          <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                  <th className="p-4">{lang === "az" ? "Əmlak" : "Property"}</th>
                  <th className="p-4">{lang === "az" ? "Növ" : "Type"}</th>
                  <th className="p-4">{lang === "az" ? "Qiymət" : "Price"}</th>
                  <th className="p-4">{lang === "az" ? "Status" : "Boost Status"}</th>
                  <th className="p-4 text-right">{lang === "az" ? "Hərəkətlər" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {properties.map((p) => (
                  <tr key={p.id} className="text-xs font-medium text-gray-700 hover:bg-gray-50/40 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images[0]}
                          className="h-10 w-10 object-cover rounded-lg border border-gray-100"
                          alt="Thumbnail"
                        />
                        <div className="min-w-0">
                          <div className="font-extrabold text-gray-800 truncate max-w-[180px]">{p.title[lang]}</div>
                          <div className="text-[10px] text-gray-400 truncate max-w-[180px]">{p.address}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 capitalize">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.type === "sell" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                      }`}>
                        {t[p.type]}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-800 font-mono">
                      {p.price.toLocaleString()} AZN
                    </td>
                    <td className="p-4">
                      {p.isBoosted ? (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-100">
                          <TrendingUp size={12} />
                          <span>VIP BOOST</span>
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[10px]">Normal</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {!p.isBoosted && (
                        <button
                          onClick={() => onOpenBoost(p)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 border border-amber-200/60 rounded-lg text-[10px] font-bold tracking-wider uppercase transition cursor-pointer"
                        >
                          Boost Listing
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. ANALYTICS SUB-TAB WITH EMBEDDED DYNAMIC SVG CHARTS */}
      {activeSubTab === "analytics" && (
        <div className="space-y-8 animate-in fade-in duration-200">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-black text-brand-dark flex items-center gap-2">
              <TrendingUp className="text-brand-red animate-pulse" />
              <span>{t.analyticsTitle}</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1 font-medium">{t.performanceChart}</p>

            {/* Simulated Interactive SVG/Pure HTML Bar chart renderingviews & clicks */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Views Chart Box */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">
                  {lang === "az" ? "Həftəlik baxış sayı (impressiyalar)" : "Weekly Property Views (impressions)"}
                </h4>
                <div className="h-44 flex items-end justify-between gap-4 px-2">
                  {[25, 45, 60, 35, 90, 75, 100].map((percentage, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full relative group">
                        {/* Hover tooltip */}
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 pointer-events-none">
                          {Math.floor(percentage * (totalViews || 120) * 0.01)} views
                        </div>
                        <div
                          style={{ height: `${percentage}%` }}
                          className="bg-brand-red rounded-t-md w-full transition duration-500 group-hover:bg-red-700 min-h-[4px]"
                        />
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 font-mono">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leads Clicks Chart Box */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">
                  {lang === "az" ? "Telefon və WhatsApp əlaqə klikləri" : "Direct WhatsApp & Call Leads clicks"}
                </h4>
                <div className="h-44 flex items-end justify-between gap-4 px-2">
                  {[10, 20, 35, 15, 60, 45, 80].map((percentage, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full relative group">
                        {/* Hover tooltip */}
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10 pointer-events-none">
                          {Math.floor(percentage * (totalLeads || 40) * 0.01)} leads
                        </div>
                        <div
                          style={{ height: `${percentage}%` }}
                          className="bg-emerald-500 rounded-t-md w-full transition duration-500 group-hover:bg-emerald-600 min-h-[4px]"
                        />
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 font-mono">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Performance suggestions list */}
            <div className="mt-8 p-4 bg-red-50/20 border border-red-50 rounded-2xl flex gap-3.5 items-start">
              <ShieldAlert className="text-brand-red shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-extrabold text-gray-800">
                  {lang === "az" ? "Elanlarınızın performansını necə 10 qat artıra bilərsiniz?" : "How to multiply your listings' performance by 10x?"}
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed font-medium">
                  {lang === "az"
                    ? "Daha çox müştəri cəlb etmək üçün, elanlarınızı VIP yüksəltmə statusuna keçirə bilərsiniz. VIP elanlar axtarışlarda ən üst sıralarda yer alır və dərhal diqqət çəkir."
                    : "To attract more direct inquiries, promote your properties to VIP Status. VIP properties are permanently fixed at the absolute top of Baku, Sumgait search indices."}
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. SUPPORT TICKETING SUB-TAB */}
      {activeSubTab === "tickets" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-200">
          
          {/* Tickets list sidebar */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-brand-dark">{t.ticketsTitle}</h3>
              <button
                onClick={() => setShowCreateTicket(!showCreateTicket)}
                className="p-1 text-brand-red hover:bg-red-50 rounded"
              >
                <PlusCircle size={18} />
              </button>
            </div>

            {showCreateTicket ? (
              <form onSubmit={handleCreateTicket} className="space-y-3">
                <div>
                  <input
                    type="text"
                    required
                    placeholder={t.ticketSubject}
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-red"
                  />
                </div>
                <div>
                  <select
                    value={ticketCategory}
                    onChange={(e: any) => setTicketCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-red"
                  >
                    <option value="tech_issue">Technical Issue</option>
                    <option value="payment">Billing / Payment</option>
                    <option value="listing">Listing Management</option>
                  </select>
                </div>
                <div>
                  <textarea
                    required
                    placeholder={t.ticketMessage}
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-red h-20"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-brand-red text-white text-xs font-bold rounded-lg hover:bg-red-700 transition"
                >
                  {t.sendReply}
                </button>
              </form>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => setActiveTicket(ticket)}
                    className={`w-full p-3.5 rounded-xl border text-left transition ${
                      activeTicket?.id === ticket.id
                        ? "border-brand-red bg-red-50/10"
                        : "border-gray-100 hover:border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-extrabold text-xs text-gray-800 truncate block max-w-[140px]">
                        {ticket.subject}
                      </span>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                        ticket.status === "open"
                          ? "bg-blue-50 text-blue-600"
                          : ticket.status === "in_progress"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-green-50 text-green-600"
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 font-mono">{ticket.id}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ticket Messages Detail area */}
          <div className="md:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[450px]">
            {activeTicket ? (
              <div className="flex flex-col justify-between h-full space-y-4">
                
                {/* Active ticket metadata info */}
                <div className="border-b border-gray-100 pb-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-base text-gray-800">{activeTicket.subject}</h4>
                    <span className="text-[10px] font-bold text-gray-400 font-mono">
                      Category: {activeTicket.category}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Submitted by: {activeTicket.userName} ({activeTicket.userEmail})
                  </div>
                </div>

                {/* Reply list */}
                <div className="flex-1 space-y-3.5 overflow-y-auto pr-2 max-h-[300px]">
                  {activeTicket.replies.map((reply, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl max-w-[85%] text-xs font-medium leading-relaxed ${
                        reply.sender === "user"
                          ? "bg-red-50/30 text-gray-700 ml-auto border border-red-100/30"
                          : "bg-gray-50 text-gray-700 mr-auto border border-gray-100"
                      }`}
                    >
                      <div className="font-bold text-[9px] text-gray-400 uppercase tracking-wider mb-1">
                        {reply.sender === "user" ? "You" : "Customer Support Officer"}
                      </div>
                      <p>{reply.message}</p>
                      <div className="text-[8px] text-gray-400 text-right mt-1.5 font-mono">
                        {new Date(reply.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="border-t border-gray-100 pt-4 flex gap-2.5">
                  <input
                    type="text"
                    required
                    placeholder={t.replyPlaceholder}
                    value={ticketReply}
                    onChange={(e) => setTicketReply(e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-red focus:bg-white transition"
                  />
                  <button
                    type="submit"
                    className="py-3 px-5 bg-brand-red hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    {t.sendReply}
                  </button>
                </form>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-20 text-gray-400 space-y-3">
                <HelpCircle size={48} className="text-gray-300 animate-bounce" />
                <div className="text-sm font-bold">
                  {lang === "az" ? "Sorğunun Detalları" : "Ticket Details Panel"}
                </div>
                <p className="text-xs text-gray-400 max-w-xs font-medium">
                  {lang === "az"
                    ? "Mesaj tarixçəsini oxumaq və ya dəstəyə cavab vermək üçün soldan bilet seçin."
                    : "Select a ticket from the left sidebar to read administrative correspondence."}
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
