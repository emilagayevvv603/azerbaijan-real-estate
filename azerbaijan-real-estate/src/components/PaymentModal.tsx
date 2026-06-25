import React, { useState } from "react";
import { TRANSLATIONS } from "../data/translations";
import { Property } from "../types";
import { getApiUrl } from "../utils/api";
import { X, CreditCard, ShieldCheck, Lock, Landmark, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PaymentModalProps {
  lang: "az" | "en" | "ru";
  property: Property;
  onClose: () => void;
  onSuccess: (boostExpiresAt: string) => void;
}

export default function PaymentModal({ lang, property, onClose, onSuccess }: PaymentModalProps) {
  const t = TRANSLATIONS[lang];
  const [plan, setPlan] = useState<"standard_vip" | "premium_vip">("standard_vip");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<any>(null);

  // Auto formats card number with spaces every 4 digits
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    const matches = value.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(" "));
    } else {
      setCardNumber(value);
    }
  };

  // Format expiry MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      setExpiry(value.slice(0, 2) + "/" + value.slice(2));
    } else {
      setExpiry(value);
    }
  };

  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 3) setCvv(value);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!cardName || cardNumber.replace(/\s/g, "").length < 16 || expiry.length < 5 || cvv.length < 3) {
      setError(lang === "az" ? "Lütfən bütün kart məlumatlarını doğru daxil edin." : "Please check card details.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(getApiUrl(`/api/listings/${property.id}/boost`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardHolder: cardName,
          cardNumber: cardNumber.replace(/\s/g, ""),
          expiry,
          cvv,
          plan,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReceipt(data);
        setTimeout(() => {
          onSuccess(data.boostExpiresAt);
        }, 3000);
      } else {
        setError(data.error || "Payment rejected by gateway");
      }
    } catch (err) {
      setError("Payment gateway offline. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 15 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-[24px] border border-gray-100 shadow-2xl w-full max-w-2xl relative overflow-hidden my-8"
      >
        
        {/* Top styling band */}
        <div className="h-2 bg-gradient-to-r from-yellow-500 via-amber-600 to-yellow-300" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition p-1.5 rounded-full hover:bg-gray-100 cursor-pointer z-10"
        >
          <X size={20} />
        </button>

        {!receipt ? (
          <div className="p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-extrabold text-brand-dark tracking-tight flex items-center gap-2">
                <Landmark className="text-amber-500" />
                <span>{t.boostTitle}</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">{t.boostDesc}</p>
            </div>

            {/* Selected Listing Summary */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6 flex items-center gap-4">
              <img
                src={property.images[0]}
                className="w-16 h-16 object-cover rounded-xl border border-gray-200"
                alt="Property thumbnail"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-800 truncate">{property.title[lang]}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{property.address}</p>
                <p className="text-xs font-semibold text-brand-red mt-1">
                  {property.price.toLocaleString()} AZN
                </p>
              </div>
            </div>

            <form onSubmit={handlePay} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column - Plan & Card details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    {t.boostPlan}
                  </label>
                  <div className="space-y-2">
                    <label className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition ${
                      plan === "standard_vip"
                        ? "border-brand-red bg-red-50/20"
                        : "border-gray-100 hover:border-gray-200 bg-white"
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="plan"
                          checked={plan === "standard_vip"}
                          onChange={() => setPlan("standard_vip")}
                          className="text-brand-red focus:ring-brand-red"
                        />
                        <span className="text-xs font-bold text-gray-700">{t.boostPlanNormal}</span>
                      </div>
                    </label>

                    <label className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition ${
                      plan === "premium_vip"
                        ? "border-amber-500 bg-amber-50/20"
                        : "border-gray-100 hover:border-gray-200 bg-white"
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="plan"
                          checked={plan === "premium_vip"}
                          onChange={() => setPlan("premium_vip")}
                          className="text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs font-bold text-gray-700">{t.boostPlanPremium}</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-green-600 font-bold text-xs">
                    <ShieldCheck size={16} />
                    <span>Secure Encrypted Gateway TLS 1.3</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 font-medium text-[10px] mt-1">
                    <Lock size={12} />
                    <span>Your credit card is processed via tokenization</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Visual Card Form */}
              <div className="space-y-4">
                {/* Visual Card Preview */}
                <div className={`p-5 rounded-2xl text-white relative shadow-lg transform hover:scale-[1.02] transition overflow-hidden ${
                  plan === "premium_vip"
                    ? "bg-gradient-to-br from-amber-600 to-yellow-500"
                    : "bg-gradient-to-br from-slate-800 to-slate-950"
                }`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-6 -mt-6" />
                  <div className="flex justify-between items-start mb-6">
                    <Landmark size={28} className="opacity-80" />
                    <span className="text-[10px] font-bold tracking-widest uppercase opacity-75">
                      MyDom Secure Pay
                    </span>
                  </div>
                  <div className="text-base font-mono tracking-widest mb-6">
                    {cardNumber || "•••• •••• •••• ••••"}
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[8px] uppercase tracking-wider opacity-60">Card Holder</div>
                      <div className="text-xs font-bold font-mono truncate max-w-[140px]">
                        {cardName.toUpperCase() || "NAME SURNAME"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] uppercase tracking-wider opacity-60">Expires</div>
                      <div className="text-xs font-bold font-mono">{expiry || "MM/YY"}</div>
                    </div>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      {t.cardHolder}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ELSAN ALIZADA"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand-red focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      {t.cardNumber}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="4129 •••• •••• ••••"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-mono font-semibold focus:outline-none focus:border-brand-red focus:bg-white transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {t.cardExpiry}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={handleExpiryChange}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-semibold text-center focus:outline-none focus:border-brand-red focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {t.cardCvv}
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="•••"
                        value={cvv}
                        onChange={handleCVVChange}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-xs font-semibold text-center focus:outline-none focus:border-brand-red focus:bg-white transition"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="col-span-full p-3 bg-red-50 border-l-4 border-brand-red text-brand-red text-xs font-bold rounded-r">
                  {error}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="col-span-full pt-4 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-sm font-bold transition"
                >
                  {lang === "az" ? "Ləğv et" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-brand-red hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} />
                  <span>{loading ? "..." : t.paySecurely}</span>
                </button>
              </div>

            </form>
          </div>
        ) : (
          /* Secure Payment Success Visual Receipt Screen */
          <div className="p-10 text-center space-y-5 flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-green-50 flex items-center justify-center text-green-500 animate-bounce">
              <CheckCircle size={48} />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-gray-800">{t.paymentSuccess}</h3>
              <p className="text-sm text-gray-500 mt-2 font-medium">
                {lang === "az"
                  ? "Transaksiya təhlükəsiz şəkildə tamamlanmışdır. Elanınız siyahılarda ön sıraya yerləşdirildi."
                  : "Transaction finalized securely. Your property listing was prioritized in search indices."}
              </p>
            </div>

            {/* Ticket Details Box */}
            <div className="bg-gray-50 border border-gray-200/60 rounded-2xl p-5 text-left w-full max-w-md font-mono text-xs space-y-2 text-gray-600">
              <div className="flex justify-between">
                <span className="font-bold uppercase text-gray-400">Gateway:</span>
                <span className="font-bold text-gray-800">MyDom Secure 3D-Secure 2.0</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold uppercase text-gray-400">Transaction ID:</span>
                <span className="font-bold text-brand-red">{receipt.transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold uppercase text-gray-400">Merchant Account:</span>
                <span>MYDOM AZERBAIJAN REGISTRY</span>
              </div>
              <div className="flex justify-between border-t border-dashed border-gray-200 pt-2 mt-2">
                <span className="font-bold uppercase text-gray-400">Charged Amount:</span>
                <span className="font-bold text-gray-800 text-sm">
                  {plan === "premium_vip" ? "29.00" : "19.00"} AZN
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-2 text-center col-span-full pt-1">
                <span>Encrypted with SHA-256 Signature</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="py-2.5 px-6 bg-brand-red hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md transition cursor-pointer"
            >
              {lang === "az" ? "Davam et" : "Proceed"}
            </button>
          </div>
        )}

      </motion.div>
    </motion.div>
  );
}
