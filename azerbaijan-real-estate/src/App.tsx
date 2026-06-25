import React, { useState, useEffect } from "react";
import { TRANSLATIONS } from "./data/translations";
import { AZERBAIJAN_CITIES } from "./data/azerbaijanCities";
import { Property, User } from "./types";
import Header from "./components/Header";
import LoginModal from "./components/LoginModal";
import PaymentModal from "./components/PaymentModal";
import PropertyDetailsModal from "./components/PropertyDetailsModal";
import AgencyDashboard from "./components/AgencyDashboard";
import AnimatedSelect from "./components/AnimatedSelect";
import OAuthConsent from "./components/OAuthConsent";
import { getApiUrl } from "./utils/api";
import { Search, RotateCcw, Bed, Move, MapPin, Heart, History, Award, Calendar, ChevronRight, HelpCircle, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [lang, setLang] = useState<"az" | "en" | "ru">("az");
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [listings, setListings] = useState<Property[]>([]);
  const [activeTab, setActiveTab] = useState<"explore" | "favorites" | "history" | "dashboard" | "tickets">("explore");

  // Filter conditions
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedType, setSelectedType] = useState<"all" | "sell" | "rent" | "exchange">("all");
  const [selectedPropType, setSelectedPropType] = useState("all");
  const [selectedBedrooms, setSelectedBedrooms] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedInterval, setSelectedInterval] = useState("all");

  // Modals
  const [showLogin, setShowLogin] = useState(false);
  const [showPayment, setShowPayment] = useState<Property | null>(null);
  const [showDetails, setShowDetails] = useState<Property | null>(null);

  const t = TRANSLATIONS[lang];

  // Load language preference
  useEffect(() => {
    const saved = localStorage.getItem("mydom_lang") as any;
    if (saved && ["az", "en", "ru"].includes(saved)) {
      setLang(saved);
    }
  }, []);

  const handleSetLang = (l: "az" | "en" | "ru") => {
    setLang(l);
    localStorage.setItem("mydom_lang", l);
  };

  // Load listings from server
  const fetchListings = async () => {
    try {
      const res = await fetch(getApiUrl("/api/listings"));
      if (res.ok) {
        const data = await res.json();
        setListings(data);
      }
    } catch (err) {
      console.error("Failed to load listings", err);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Sync session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("mydom_token");
    const savedUser = localStorage.getItem("mydom_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLoginSuccess = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("mydom_token", newToken);
    localStorage.setItem("mydom_user", JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("mydom_token");
    localStorage.removeItem("mydom_user");
    setActiveTab("explore");
  };

  // Add view trigger & register to view history on selection
  const handleSelectProperty = async (property: Property) => {
    setShowDetails(property);
    
    // 1. Trigger viewed API to increment views count on the server
    try {
      fetch(getApiUrl(`/api/listings/${property.id}/view`), { method: "POST" });
    } catch (err) {
      console.error(err);
    }

    // 2. Add property to view history if logged in
    if (user) {
      try {
        const res = await fetch(getApiUrl("/api/history"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, propertyId: property.id }),
        });
        if (res.ok) {
          const updated = await res.json();
          const newUser = { ...user, viewHistory: updated.viewHistory };
          setUser(newUser);
          localStorage.setItem("mydom_user", JSON.stringify(newUser));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Toggle favorite listings in db
  const handleToggleFavorite = async (propertyId: string) => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    try {
      const res = await fetch(getApiUrl("/api/favorites/toggle"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, propertyId }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedUser = { ...user, favorites: data.favorites };
        setUser(updatedUser);
        localStorage.setItem("mydom_user", JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Failed to toggle favorite", err);
    }
  };

  // Filter logic
  const filteredListings = listings.filter((p) => {
    // 1. Text Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title[lang].toLowerCase().includes(q);
      const matchDesc = p.description[lang].toLowerCase().includes(q);
      const matchAddr = p.address.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAddr) return false;
    }

    // 2. City
    if (selectedCity !== "all" && p.city !== selectedCity) return false;

    // 3. Buy/Rent type
    if (selectedType !== "all" && p.type !== selectedType) return false;

    // 4. Property Category Type
    if (selectedPropType !== "all" && p.propertyType !== selectedPropType) return false;

    // 5. Bedrooms
    if (selectedBedrooms !== "all") {
      if (selectedBedrooms === "4+") {
        if (p.bedrooms < 4) return false;
      } else if (p.bedrooms !== Number(selectedBedrooms)) {
        return false;
      }
    }

    // 6. Rent Interval
    if (selectedType === "rent" && selectedInterval !== "all" && p.rentInterval !== selectedInterval) {
      return false;
    }

    // 7. Price
    if (minPrice && p.price < Number(minPrice)) return false;
    if (maxPrice && p.price > Number(maxPrice)) return false;

    return true;
  });

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCity("all");
    setSelectedType("all");
    setSelectedPropType("all");
    setSelectedBedrooms("all");
    setMinPrice("");
    setMaxPrice("");
    setSelectedInterval("all");
  };

  // Listings for Favorites tab
  const favoriteListings = listings.filter((p) => user?.favorites?.includes(p.id));

  // Listings for Viewed History tab (sorted most recently viewed first)
  const historyListings = (user?.viewHistory || [])
    .map((h) => {
      const match = listings.find((p) => p.id === h.propertyId);
      return match ? { ...match, viewedAt: h.viewedAt } : null;
    })
    .filter((p): p is any => p !== null)
    .reverse();

  if (window.location.pathname === "/oauth/consent") {
    return (
      <OAuthConsent
        lang={lang}
        onLoginSuccess={handleLoginSuccess}
        currentUser={user}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      
      {/* Master localized Header */}
      <Header
        lang={lang}
        setLang={handleSetLang}
        user={user}
        onOpenLogin={() => setShowLogin(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Core Router */}
      <main className="flex-grow">

        {/* TAB 1: PROPERTIES EXPLORER & ADVANCED MULTI-DROPDOWN FILTER ENGINE */}
        {activeTab === "explore" && (
          <div>
            
            {/* Hero Interactive Showcase Banner */}
            <section className="bg-gradient-to-b from-white to-gray-100/50 border-b border-gray-100 py-20 px-4 overflow-hidden">
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.12 }
                  }
                }}
                className="max-w-7xl mx-auto text-center space-y-6"
              >
                <motion.h1 
                  variants={{
                    hidden: { opacity: 0, y: 35 },
                    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 15 } }
                  }}
                  className="text-4xl sm:text-6xl font-black text-brand-dark tracking-tight leading-none"
                >
                  {t.hero_title.split(" ").map((word, i) => {
                    const lowercaseWord = word.toLowerCase();
                    const isKeyword = lowercaseWord.includes("arzu") || lowercaseWord.includes("ev") || lowercaseWord.includes("dream") || lowercaseWord.includes("dom");
                    return (
                      <span key={i} className={isKeyword ? "text-brand-red inline-block" : "inline-block"}>
                        {word}{" "}
                      </span>
                    );
                  })}
                </motion.h1>

                <motion.p 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="text-gray-500 font-medium max-w-2xl mx-auto text-sm sm:text-base leading-relaxed"
                >
                  {t.hero_lead}
                </motion.p>

                {/* Filter Panel Card Container */}
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 40 },
                    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70, damping: 13 } }
                  }}
                  className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 max-w-5xl mx-auto shadow-xl space-y-6 text-left transform translate-y-4"
                >
                  
                  {/* Primary text search row */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-grow relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Search size={18} />
                      </div>
                      <input
                        type="text"
                        placeholder={t.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-semibold focus:outline-none focus:border-brand-red focus:bg-white transition"
                      />
                    </div>
                    <button
                      onClick={handleResetFilters}
                      className="px-5 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl text-sm font-bold border border-gray-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <RotateCcw size={16} />
                      <span>{t.resetBtn}</span>
                    </button>
                  </div>

                  {/* Dropdown Filters Bento Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    
                    {/* 1. City selection dropdown (All Azerbaijan regions supported) */}
                    <AnimatedSelect
                      label={t.filterCity}
                      value={selectedCity}
                      onChange={setSelectedCity}
                      options={[
                        { value: "all", label: "📍 " + t.anyCity },
                        ...AZERBAIJAN_CITIES.map((city) => ({
                          value: city.id,
                          label: "📍 " + city.name[lang],
                        })),
                      ]}
                    />

                    {/* 2. Transaction Type Selection (Rent/Sell/Exchange) */}
                    <AnimatedSelect
                      label={t.filterType}
                      value={selectedType}
                      onChange={(val) => {
                        setSelectedType(val as any);
                        setSelectedInterval("all"); // Reset interval
                      }}
                      options={[
                        { value: "all", label: "🏷️ " + t.anyType },
                        { value: "sell", label: "💰 " + t.sell },
                        { value: "rent", label: "🔑 " + t.rent },
                        { value: "exchange", label: "🔁 " + t.exchange },
                      ]}
                    />

                    {/* 3. Hourly / Daily Rent Intervals (Conditionally shown for Rent) */}
                    {selectedType === "rent" ? (
                      <AnimatedSelect
                        label={t.rentInterval}
                        value={selectedInterval}
                        onChange={setSelectedInterval}
                        options={[
                          { value: "all", label: "📅 " + t.allIntervals },
                          { value: "hourly", label: "⏱️ " + t.hourly },
                          { value: "daily", label: "📆 " + t.daily },
                          { value: "weekly", label: "🗓️ " + t.weekly },
                          { value: "monthly", label: "🏢 " + t.monthly },
                        ]}
                      />
                    ) : (
                      /* 3. Fallback: Category Selection */
                      <AnimatedSelect
                        label={t.filterPropType}
                        value={selectedPropType}
                        onChange={setSelectedPropType}
                        options={[
                          { value: "all", label: "🏠 " + t.anyPropType },
                          { value: "apartment_new", label: "🏢 " + t.apartment_new },
                          { value: "apartment_old", label: "🏬 " + t.apartment_old },
                          { value: "villa", label: "🏡 " + t.villa },
                          { value: "office", label: "💼 " + t.office },
                          { value: "land", label: "🗺️ " + t.land },
                          { value: "commercial", label: "🏦 " + t.commercial },
                        ]}
                      />
                    )}

                    {/* 4. Bedrooms count selection */}
                    <AnimatedSelect
                      label={t.filterRooms}
                      value={selectedBedrooms}
                      onChange={setSelectedBedrooms}
                      options={[
                        { value: "all", label: "🛏️ " + t.anyRooms },
                        { value: "1", label: "1" },
                        { value: "2", label: "2" },
                        { value: "3", label: "3" },
                        { value: "4+", label: "4+" },
                      ]}
                    />

                  </div>

                  {/* Sub-filtering parameters: Min / Max Price bounds */}
                  <div className="pt-2 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
                    <div className="md:col-span-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {t.filterPrice} (AZN)
                      </span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <input
                          type="number"
                          placeholder="Min"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-red focus:bg-white transition text-center"
                        />
                        <span className="text-gray-300 font-bold">—</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-red focus:bg-white transition text-center"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 flex items-end justify-end h-full">
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {lang === "az" ? "Tapılan elanlar" : "Found Listings"}:{" "}
                        <span className="text-brand-red font-mono text-xs font-extrabold">
                          {filteredListings.length}
                        </span>
                      </div>
                    </div>
                  </div>

                </motion.div>

              </motion.div>
            </section>

            {/* Core Property Listings Grid List */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
              
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-extrabold text-brand-dark tracking-tight">
                  {lang === "az" ? "Yeni və VIP təkliflər" : "Recent & VIP Proposals"}
                </h2>
              </div>

              {filteredListings.length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-100 rounded-3xl max-w-md mx-auto space-y-4">
                  <div className="h-16 w-16 bg-red-50 text-brand-red rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                    !
                  </div>
                  <h3 className="font-extrabold text-gray-800 text-sm">
                    {lang === "az" ? "Heç bir uyğun elan tapılmadı" : "No properties match your criteria"}
                  </h3>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    {lang === "az" ? "Zəhmət olmasa tətbiq etdiyiniz axtarış filtrlərini dəyişərək yenidən yoxlayın." : "Try resetting parameters or modifying search words."}
                  </p>
                </div>
              ) : (
                <motion.div 
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.08
                      }
                    }
                  }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {filteredListings.map((property) => {
                    const isFavorited = user?.favorites?.includes(property.id) || false;
                    return (
                      <motion.article
                        key={property.id}
                        variants={{
                          hidden: { opacity: 0, y: 30, scale: 0.95 },
                          show: { 
                            opacity: 1, 
                            y: 0, 
                            scale: 1,
                            transition: { type: "spring", stiffness: 100, damping: 15 } 
                          }
                        }}
                        whileHover={{ 
                          y: -8, 
                          scale: 1.02,
                          boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.08)",
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectProperty(property)}
                        className={`bg-white rounded-3xl overflow-hidden border border-gray-100/80 shadow-sm transition-all duration-300 flex flex-col justify-between cursor-pointer group relative ${
                          property.isBoosted ? "ring-2 ring-amber-500/40" : ""
                        }`}
                      >
                        
                        {/* Image overlay with favorited and VIP tags */}
                        <div className="aspect-[1.5/1] relative overflow-hidden bg-gray-100">
                          <img
                            src={property.images[0]}
                            alt={property.title[lang]}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          
                          {/* VIP overlay badge */}
                          {property.isBoosted && (
                            <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                              <Award size={12} />
                              <span>{t.featuredBadge}</span>
                            </div>
                          )}
 
                          {/* Favorited toggler overlay */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(property.id);
                            }}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur hover:bg-white text-gray-400 hover:text-brand-red transition shadow-md"
                          >
                            <Heart size={16} fill={isFavorited ? "#e50914" : "none"} className={isFavorited ? "text-brand-red" : ""} />
                          </button>
 
                          {/* Buy/Rent Banner overlay */}
                          <div className="absolute bottom-4 left-4 flex gap-1.5">
                            <span className="bg-brand-dark/80 backdrop-blur text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                              {t[property.type]}
                            </span>
                            {property.type === "rent" && property.rentInterval && (
                              <span className="bg-brand-red text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                                {t[property.rentInterval]}
                              </span>
                            )}
                          </div>
 
                        </div>
 
                        {/* Property summary */}
                        <div className="p-6 space-y-4">
                          
                          <div>
                            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold">
                              {property.address.split(",").slice(-2).join(", ")}
                            </div>
                            <h3 className="text-base font-extrabold text-brand-dark mt-1 line-clamp-1 group-hover:text-brand-red transition">
                              {property.title[lang]}
                            </h3>
                          </div>
 
                          {/* Quick spec icons */}
                          <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 pt-1">
                            <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                              <Bed size={14} className="text-brand-red" />
                              <span>{property.bedrooms} BR</span>
                            </span>
                            <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg">
                              <Move size={14} className="text-brand-red" />
                              <span>{property.area} m²</span>
                            </span>
                            <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg font-mono text-[10px]">
                              {AZERBAIJAN_CITIES.find((c) => c.id === property.city)?.name[lang]}
                            </span>
                          </div>
 
                          {/* Price Tag & CTA link */}
                          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                {property.type === "rent" && property.rentInterval
                                  ? t[property.rentInterval]
                                  : (lang === "az" ? "Satış qiyməti" : lang === "en" ? "Sale price" : "Цена продажи")}
                              </span>
                              <span className="text-lg font-extrabold text-brand-red font-mono">
                                {property.price.toLocaleString()} {t.priceUnit}
                                {property.type === "rent" && property.rentInterval && (
                                  <span className="text-xs text-gray-400 font-medium">
                                    {" "}/ {property.rentInterval === "monthly" ? (lang === "az" ? "ay" : lang === "en" ? "mo" : "мес") : (lang === "az" ? "gün" : "day")}
                                  </span>
                                )}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-brand-dark group-hover:text-brand-red transition flex items-center gap-0.5">
                              <span>{t.viewDetails}</span>
                              <ChevronRight size={14} />
                            </span>
                          </div>
 
                        </div>
 
                      </motion.article>
                    );
                  })}
                </motion.div>
              )}

            </section>
          </div>
        )}

        {/* TAB 2: FAVORITE LISTINGS PAGE */}
        {activeTab === "favorites" && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in duration-200">
            <div className="mb-10 text-center sm:text-left">
              <h2 className="text-2xl font-extrabold text-brand-dark tracking-tight flex items-center justify-center sm:justify-start gap-2">
                <Heart className="text-brand-red" fill="currentColor" />
                <span>{t.favoritesTitle}</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-semibold">
                {lang === "az" ? "Yadda saxladığınız elit təkliflərə istənilən an daxil olun." : "Quickly review property listings you saved."}
              </p>
            </div>

            {favoriteListings.length === 0 ? (
              <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl max-w-sm mx-auto space-y-4">
                <Heart size={44} className="text-gray-300 mx-auto" />
                <h4 className="font-bold text-gray-800 text-sm">{t.noFavorites}</h4>
                <button
                  onClick={() => setActiveTab("explore")}
                  className="px-4 py-2 bg-brand-red hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  {lang === "az" ? "Elanlara keç" : "Go Explore"}
                </button>
              </div>
            ) : (
              <motion.div 
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.08
                    }
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {favoriteListings.map((property) => (
                  <motion.article
                    key={property.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                    }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectProperty(property)}
                    className="bg-white rounded-3xl overflow-hidden border border-gray-100/80 shadow-sm hover:shadow-xl transition flex flex-col justify-between cursor-pointer group"
                  >
                    <img src={property.images[0]} className="aspect-[1.5/1] object-cover" alt="Thumb" />
                    <div className="p-6 space-y-4">
                      <h3 className="text-base font-extrabold text-brand-dark group-hover:text-brand-red transition duration-200">{property.title[lang]}</h3>
                      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <span className="text-brand-red font-mono font-bold">{property.price.toLocaleString()} AZN</span>
                        <span className="text-xs font-bold text-gray-500">{t.viewDetails}</span>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            )}
          </section>
        )}

        {/* TAB 3: VIEWED PROPERTIES HISTORY */}
        {activeTab === "history" && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in duration-200">
            <div className="mb-10 text-center sm:text-left">
              <h2 className="text-2xl font-extrabold text-brand-dark tracking-tight flex items-center justify-center sm:justify-start gap-2">
                <History className="text-brand-red" />
                <span>{t.historyTitle}</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-semibold">
                {lang === "az" ? "Əvvəllər daxil olduğunuz və araşdırdığınız son elanlar." : "Track previously opened properties seamlessly."}
              </p>
            </div>

            {historyListings.length === 0 ? (
              <div className="text-center py-20 bg-white border border-gray-100 rounded-3xl max-w-sm mx-auto space-y-4">
                <History size={44} className="text-gray-300 mx-auto" />
                <h4 className="font-bold text-gray-800 text-sm">{t.noHistory}</h4>
              </div>
            ) : (
              <motion.div 
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.08
                    }
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {historyListings.map((property: any) => (
                  <motion.article
                    key={property.id}
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                    }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectProperty(property)}
                    className="bg-white rounded-3xl overflow-hidden border border-gray-100/80 shadow-sm hover:shadow-xl transition flex flex-col justify-between cursor-pointer group"
                  >
                    <img src={property.images[0]} className="aspect-[1.5/1] object-cover" alt="Thumb" />
                    <div className="p-6 space-y-4">
                      <h3 className="text-base font-extrabold text-brand-dark group-hover:text-brand-red transition duration-200">{property.title[lang]}</h3>
                      <div className="flex justify-between items-center pt-4 border-t border-gray-100 text-xs font-semibold text-gray-400">
                        <span className="text-brand-red font-mono font-bold">{property.price.toLocaleString()} AZN</span>
                        <span>{new Date(property.viewedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            )}
          </section>
        )}

        {/* TAB 4: AGENCY PORTAL PANEL (BENTO DASHBOARD + ANLAYTICS + CREATE LISTINGS) */}
        {activeTab === "dashboard" && user && (
          <AgencyDashboard
            lang={lang}
            token={token}
            agentId={user.id}
            properties={listings.filter((p) => p.agentId === user.id)}
            onPropertyCreated={() => {
              fetchListings();
            }}
            onOpenBoost={(p) => setShowPayment(p)}
          />
        )}

        {/* TAB 5: SUPPORT SYSTEM OUTSIDE DASHBOARD */}
        {activeTab === "tickets" && user && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <AgencyDashboard
              lang={lang}
              token={token}
              agentId={user.id}
              properties={[]} // Only ticketing
              onPropertyCreated={() => {}}
              onOpenBoost={() => {}}
            />
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-brand-dark text-gray-400 border-t border-gray-800 py-12 px-4 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8 text-center sm:text-left">
          <div className="space-y-4">
            <h4 className="text-white font-extrabold text-lg tracking-wider">
              MYDOM<span className="text-brand-red">.AZ</span>
            </h4>
          </div>
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-4">Support Centre</h4>
            <ul className="text-xs space-y-2.5 font-medium">
              <li>Direct Ticket Portal</li>
              <li>WhatsApp Support Hotline</li>
              <li>Secure Credit Card Protection</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-gray-800/80 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-gray-500">
          <span>{t.footer}</span>
          <div className="flex gap-4 items-center">
            <a href="#" className="hover:text-white">Terms of Use</a>
            <span className="text-gray-700">•</span>
            <a href="#" className="hover:text-white">Privacy Policy</a>
          </div>
        </div>
      </footer>

      {/* --- OVERLAY MODALS --- */}
      {showLogin && (
        <LoginModal
          lang={lang}
          onClose={() => setShowLogin(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {showPayment && (
        <PaymentModal
          lang={lang}
          property={showPayment}
          onClose={() => setShowPayment(null)}
          onSuccess={(expires) => {
            fetchListings(); // reload listings to update boosted priorities
            setShowPayment(null);
          }}
        />
      )}

      {showDetails && (
        <PropertyDetailsModal
          lang={lang}
          property={showDetails}
          user={user}
          onClose={() => setShowDetails(null)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

    </div>
  );
}
