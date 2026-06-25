import React, { useState } from "react";
import { TRANSLATIONS } from "../data/translations";
import { Property, User } from "../types";
import { getApiUrl } from "../utils/api";
import { X, Bed, Bath, Move, MapPin, Phone, MessageSquare, Mail, Heart, Calendar, Award } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PropertyDetailsModalProps {
  lang: "az" | "en" | "ru";
  property: Property;
  user: User | null;
  onClose: () => void;
  onToggleFavorite: (propertyId: string) => void;
}

export default function PropertyDetailsModal({
  lang,
  property,
  user,
  onClose,
  onToggleFavorite,
}: PropertyDetailsModalProps) {
  const t = TRANSLATIONS[lang];
  const [activeImage, setActiveImage] = useState(property.images[0]);
  const [leadRegistered, setLeadRegistered] = useState(false);
  const isFavorited = user?.favorites?.includes(property.id) || false;

  // Track the lead in server database (incrementing leads count for analytics)
  const handleContactLead = async (actionType: "whatsapp" | "call" | "email") => {
    try {
      const res = await fetch(getApiUrl(`/api/listings/${property.id}/lead`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setLeadRegistered(true);
        // Softly trigger local window simulations
        if (actionType === "whatsapp") {
          window.open(`https://wa.me/${property.agentPhone.replace(/\s+/g, "")}?text=Salam, MYDOM.AZ-da yerleshen elaninizla bagli: ${property.title[lang]}`, "_blank");
        } else if (actionType === "call") {
          window.location.href = `tel:${property.agentPhone}`;
        } else {
          window.location.href = `mailto:${property.agentEmail}?subject=Inquiry on MYDOM.AZ: ${property.title[lang]}`;
        }
      }
    } catch (err) {
      console.error("Failed to register lead metric:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-4xl relative overflow-hidden transition-all my-8 transform"
      >
        
        {/* VIP Highlighting Band */}
        {property.isBoosted && (
          <div className="bg-gradient-to-r from-yellow-500 via-amber-600 to-yellow-400 text-white text-center py-2 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Award size={14} className="animate-spin" />
            <span>{t.featuredBadge}</span>
          </div>
        )}

        {/* Close button overlay */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition p-2 bg-white/80 backdrop-blur rounded-full hover:bg-gray-100 shadow-md z-10 cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Left Column: Media Gallery */}
          <div className="bg-gray-950 p-6 flex flex-col justify-between">
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 flex items-center justify-center relative">
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImage}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  src={activeImage}
                  alt={property.title[lang]}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
            </div>

            {/* Thumbnail selector */}
            <div className="flex gap-2.5 mt-4 overflow-x-auto pb-1">
              {property.images.map((img, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition cursor-pointer ${
                    activeImage === img ? "border-brand-red scale-105" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover" alt="Property thumb" />
                </motion.button>
              ))}
            </div>

            <div className="mt-6 border-t border-gray-800/60 pt-4 flex justify-between items-center text-gray-400 text-xs font-mono">
              <span>LISTING ID: {property.id}</span>
              <span>ADDED: {new Date(property.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Right Column: Information & Lead Contacts */}
          <div className="p-8 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
            <div className="space-y-6">
              
              {/* Badges & Favorite toggler */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    property.type === "sell"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : property.type === "rent"
                      ? "bg-blue-50 text-blue-700 border border-blue-100"
                      : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                  }`}>
                    {t[property.type]}
                  </span>

                  {property.type === "rent" && property.rentInterval && (
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-gray-200">
                      <Calendar size={12} className="inline mr-1 -mt-0.5" />
                      {t[property.rentInterval]}
                    </span>
                  )}

                  <span className="bg-red-50 text-brand-red px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-red-100">
                    {t[property.propertyType]}
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onToggleFavorite(property.id)}
                  className={`p-2 rounded-xl border transition cursor-pointer ${
                    isFavorited
                      ? "bg-red-50 border-red-100 text-brand-red shadow"
                      : "bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Heart size={20} fill={isFavorited ? "currentColor" : "none"} />
                </motion.button>
              </div>

              {/* Title & Location */}
              <div>
                <h3 className="text-xl font-extrabold text-brand-dark tracking-tight leading-snug">
                  {property.title[lang]}
                </h3>
                <div className="flex items-center gap-1.5 text-gray-400 text-xs font-semibold mt-2.5">
                  <MapPin size={14} className="text-brand-red shrink-0" />
                  <span>{property.address}</span>
                </div>
              </div>

              {/* Price Tag */}
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {property.type === "rent" && property.rentInterval
                    ? t[property.rentInterval]
                    : (lang === "az" ? "Satış qiyməti" : lang === "en" ? "Purchase Price" : "Цена покупки")}
                </span>
                <span className="text-2xl font-extrabold text-brand-red font-mono">
                  {property.price.toLocaleString()} {t.priceUnit}
                  {property.type === "rent" && property.rentInterval && (
                    <span className="text-xs text-gray-400 font-semibold uppercase ml-1">
                      / {t[property.rentInterval]}
                    </span>
                  )}
                </span>
              </div>

              {/* Grid Specifications */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                  <Bed size={18} className="mx-auto text-brand-red mb-1" />
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {t.bedrooms}
                  </div>
                  <div className="text-sm font-extrabold text-gray-800 mt-0.5">
                    {property.bedrooms}
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                  <Bath size={18} className="mx-auto text-brand-red mb-1" />
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {t.bathrooms}
                  </div>
                  <div className="text-sm font-extrabold text-gray-800 mt-0.5">
                    {property.bathrooms}
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                  <Move size={18} className="mx-auto text-brand-red mb-1" />
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {t.area}
                  </div>
                  <div className="text-sm font-extrabold text-gray-800 mt-0.5">
                    {property.area} m²
                  </div>
                </div>
              </div>

              {/* Property description */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {lang === "az" ? "Əmlak haqqında" : "About Property"}
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed font-medium bg-gray-50 p-3.5 rounded-xl border border-gray-100 max-h-32 overflow-y-auto">
                  {property.description[lang]}
                </p>
              </div>

            </div>

            {/* Direct Agency / Owner contact Actions */}
            <div className="mt-8 pt-6 border-t border-gray-100 space-y-3.5">
              
              {/* Agent presentation */}
              <div className="flex items-center gap-3 bg-red-50/20 border border-red-50 p-3.5 rounded-2xl">
                <div className="h-10 w-10 rounded-full bg-brand-red text-white font-extrabold flex items-center justify-center">
                  {property.agentName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-extrabold text-gray-800">{property.agentName}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">
                    {t.agentBadge} (Premium Partner)
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleContactLead("whatsapp")}
                  className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  <MessageSquare size={16} />
                  <span>{t.whatsappBtn}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleContactLead("call")}
                  className="py-3 bg-brand-red hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  <Phone size={16} />
                  <span>{t.callBtn}</span>
                </motion.button>
              </div>

              {leadRegistered && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1 animate-pulse"
                >
                  ✓ {lang === "az" ? "Əlaqə qeydə alındı! Agent məlumatlandırıldı." : "Inquiry Registered! Agent notified."}
                </motion.div>
              )}

            </div>

          </div>

        </div>

      </motion.div>
    </div>
  );
}
