import React, { useState } from "react";
import { TRANSLATIONS } from "../data/translations";
import { X, Mail, Phone, ShieldCheck, ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getApiUrl } from "../utils/api";
import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup } from "firebase/auth";

interface LoginModalProps {
  lang: "az" | "en" | "ru";
  onClose: () => void;
  onLoginSuccess: (token: string, user: any) => void;
}

export default function LoginModal({ lang, onClose, onLoginSuccess }: LoginModalProps) {
  const t = TRANSLATIONS[lang];

  // Core Steps: "main" | "otp" | "phone-collection" | "phone-otp"
  const [currentView, setCurrentView] = useState<"main" | "otp" | "phone-collection" | "phone-otp">("main");
  const [pendingAuth, setPendingAuth] = useState<{ token: string, user: any } | null>(null);
  const [phoneForVerification, setPhoneForVerification] = useState("");
  const [phoneOtpCode, setPhoneOtpCode] = useState("");
  
  // Tab states for main view
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  
  // States for manual flow
  const [identifier, setIdentifier] = useState("");
  const [fullName, setFullName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [identifierType, setIdentifierType] = useState<"email" | "phone" | null>(null);

  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const determineIdentifierType = (val: string) => {
    if (val.includes("@")) return "email";
    if (val.replace(/\D/g, "").length >= 7) return "phone";
    return null;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const type = determineIdentifierType(identifier);
    if (!type) {
      setError(lang === "az" ? "Düzgün e-poçt və ya nömrə daxil edin" : "Please enter a valid email or phone");
      return;
    }
    if (authMode === "register" && !fullName.trim()) {
      setError(lang === "az" ? "Zəhmət olmasa ad və soyadınızı daxil edin" : "Please enter your full name");
      return;
    }

    setIdentifierType(type);
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(getApiUrl("/api/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(data.message + (data.otpForTesting ? ` (Demo: ${data.otpForTesting})` : ""));
        setCurrentView("otp");
      } else {
        setError(data.error || "Failed to send code.");
      }
    } catch (err: any) {
      setError("Server connection error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setError(lang === "az" ? "Düzgün kod daxil edin" : "Please enter a valid code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload: any = { identifier, code: otpCode };
      if (authMode === "register" && fullName.trim()) {
        payload.fullName = fullName.trim();
      }

      const res = await fetch(getApiUrl("/api/auth/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (res.ok && data.token) {
        if (!data.user.isPhoneVerified && authMode === "register") {
          setPendingAuth({ token: data.token, user: data.user });
          setCurrentView("phone-collection");
        } else {
          onLoginSuccess(data.token, data.user);
          onClose();
        }
      } else {
        setError(data.error || "Invalid code");
      }
    } catch (err: any) {
      setError("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSignIn = async (provider: "google" | "apple", selectedEmail?: string, selectedName?: string) => {
    setLoading(true);
    setError("");
    try {
      let finalEmail = selectedEmail;
      let finalName = selectedName;
      let finalPhotoUrl = undefined;

      if (provider === "google") {
        try {
          const result = await signInWithPopup(auth, googleProvider);
          const user = result.user;
          finalEmail = user.email || undefined;
          finalName = user.displayName || undefined;
          finalPhotoUrl = user.photoURL || undefined;
          
          if (!finalEmail) {
            throw new Error(lang === "az" ? "Google hesabı ilə e-poçt əldə etmək mümkün olmadı" : "Could not retrieve email from Google account");
          }
        } catch (firebaseErr: any) {
           setError("Google sign-in cancelled or failed: " + (firebaseErr.message || String(firebaseErr)));
           setLoading(false);
           return;
        }
      }

      const res = await fetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, email: finalEmail, fullName: finalName, photoUrl: finalPhotoUrl }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        if (!data.user.isPhoneVerified) {
          setPendingAuth({ token: data.token, user: data.user });
          setCurrentView("phone-collection");
        } else {
          onLoginSuccess(data.token, data.user);
          onClose();
        }
      } else {
        setError("Provider sign-in failed: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      setError("OAuth servers offline: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleSendPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneForVerification || phoneForVerification.length < 5) {
      setError(lang === "az" ? "Düzgün nömrə daxil edin" : "Please enter a valid phone number");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(getApiUrl("/api/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: phoneForVerification }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(data.message + (data.otpForTesting ? ` (Demo: ${data.otpForTesting})` : ""));
        setCurrentView("phone-otp");
      } else {
        setError(data.error || "Failed to send code.");
      }
    } catch (err: any) {
      setError("Server connection error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOtpCode || phoneOtpCode.length < 4) {
      setError(lang === "az" ? "Düzgün kod daxil edin" : "Please enter a valid code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload: any = { identifier: phoneForVerification, code: phoneOtpCode };
      const res = await fetch(getApiUrl("/api/auth/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (res.ok) {
        // Assume verified. Since we are already logged in (have a token in pendingAuth),
        // we can just update the user state.
        if (pendingAuth) {
          const updatedUser = { ...pendingAuth.user, phone: phoneForVerification, isPhoneVerified: true };
          // We ideally should tell the server to update the user record
          await fetch(getApiUrl("/api/user/update"), {
             method: "PUT",
             headers: { "Content-Type": "application/json", "Authorization": `Bearer ${pendingAuth.token}` },
             body: JSON.stringify({ phone: phoneForVerification, isPhoneVerified: true }),
          });
          onLoginSuccess(pendingAuth.token, updatedUser);
        }
        onClose();
      } else {
        setError(data.error || "Invalid code");
      }
    } catch (err: any) {
      setError("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const renderAlerts = () => (
    <>
      {error && (
        <div className="mb-5 p-3.5 bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-2">
          <ShieldCheck size={14} className="text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-5 p-3.5 bg-emerald-50/80 backdrop-blur-sm border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
          <span>{success}</span>
        </div>
      )}
    </>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-0 md:p-4"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 10 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white md:rounded-[24px] shadow-2xl shadow-black/20 w-full max-w-[420px] relative min-h-[100dvh] md:min-h-0 md:max-h-[90vh] flex flex-col md:ring-1 md:ring-gray-200/50"
      >
        <div className="flex-1 overflow-y-auto">
        {/* Minimalist Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 transition-colors p-1.5 rounded-full hover:bg-gray-100 cursor-pointer z-10"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        <div className="p-8 pb-10">
          <div className="text-center mb-8 pt-2">
            <h3 className="text-[28px] font-black tracking-tight text-brand-dark mb-1">
              MYDOM<span className="text-brand-red">.AZ</span>
            </h3>
            <p className="text-gray-500 text-sm font-medium">
              {currentView === "main" ? (lang === "az" ? "Sistemə daxil olun" : "Welcome back") : (lang === "az" ? "Təsdiq" : "Verification")}
            </p>
          </div>

          {renderAlerts()}

          <AnimatePresence mode="wait" initial={false}>
            {currentView === "main" && (
              <motion.div 
                key="main"
                initial={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                
                {/* Auth Tabs */}
                <div className="flex p-1 bg-gray-100/80 backdrop-blur rounded-xl">
                  <button
                    onClick={() => { setAuthMode("login"); setError(""); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      authMode === "login" ? "bg-white text-brand-dark shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {lang === "az" ? "Daxil ol" : "Sign In"}
                  </button>
                  <button
                    onClick={() => { setAuthMode("register"); setError(""); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      authMode === "register" ? "bg-white text-brand-dark shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {lang === "az" ? "Qeydiyyat" : "Register"}
                  </button>
                </div>

                {/* Google Play Prominent Button */}
                <button
                  type="button"
                  onClick={() => handleProviderSignIn("google")}
                  disabled={loading}
                  className="w-full py-3.5 px-4 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm rounded-xl text-sm font-semibold text-gray-800 flex items-center justify-center gap-3 transition-all cursor-pointer group disabled:opacity-50"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                    className="h-5 w-5 group-hover:scale-110 transition-transform"
                    alt="Google"
                  />
                  <span>
                    {loading ? (lang === "az" ? "Gözləyin..." : "Please wait...") : (authMode === "login" 
                      ? (lang === "az" ? "Google ilə daxil ol" : "Sign in with Google")
                      : (lang === "az" ? "Google ilə qeydiyyatdan keç" : "Register with Google"))}
                  </span>
                </button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink-0 mx-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    {lang === "az" ? "və ya" : "or"}
                  </span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <form onSubmit={handleSendOTP} className="space-y-4">
                  
                  {authMode === "register" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                        {lang === "az" ? "Ad və Soyad" : "Full Name"}
                      </label>
                      <input
                        type="text"
                        required={authMode === "register"}
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Elcan Əlizadə"
                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red transition-all placeholder:text-gray-400"
                      />
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                      {lang === "az" ? "E-poçt və ya nömrə" : lang === "en" ? "Email or phone number" : "Электронная почта или телефон"}
                    </label>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (val.length === 1 && /[0-9]/.test(val)) {
                          val = "+994" + val;
                        }
                        setIdentifier(val);
                      }}
                      placeholder="example@gmail.com / +994501234567"
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red transition-all placeholder:text-gray-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || identifier.length < 5 || (authMode === "register" && fullName.length < 2)}
                    className="w-full py-3.5 bg-brand-dark hover:bg-black text-white rounded-xl text-sm font-semibold shadow-xl shadow-brand-dark/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {loading ? (
                      <span className="animate-pulse">{lang === "az" ? "Göndərilir..." : "Sending..."}</span>
                    ) : (
                      <>
                        {authMode === "login" ? (lang === "az" ? "Daxil ol" : "Sign In") : (lang === "az" ? "Qeydiyyatı tamamla" : "Complete Registration")}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-[11px] text-gray-400 text-center font-medium leading-relaxed px-2 pt-2">
                  {lang === "az" 
                    ? "Davam edərək istifadəçi şərtlərini və məxfilik siyasətini qəbul edirsiniz." 
                    : "By continuing, you agree to our Terms of Service and Privacy Policy."}
                </p>
              </motion.div>
            )}

            {currentView === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-red">
                    {identifierType === "email" ? <Mail size={24} /> : <Phone size={24} />}
                  </div>
                  <h4 className="text-xl font-bold text-brand-dark tracking-tight">
                    {lang === "az" ? "Təsdiq kodunu daxil edin" : "Enter confirmation code"}
                  </h4>
                  <p className="text-sm text-gray-500 font-medium">
                    {lang === "az" ? "Kod bu ünvana göndərildi:" : "Code was sent to:"} <br/>
                    <span className="font-bold text-brand-dark">{identifier}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-5">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="w-full text-center tracking-[0.75em] text-3xl font-black px-4 py-5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red transition-all placeholder:text-gray-300"
                  />

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setCurrentView("main"); setError(""); setSuccess(""); setOtpCode(""); }}
                      className="py-3.5 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <button
                      type="submit"
                      disabled={loading || otpCode.length < 4}
                      className="flex-1 py-3.5 bg-brand-dark hover:bg-black text-white rounded-xl text-sm font-semibold shadow-xl shadow-brand-dark/10 transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
                    >
                      {loading ? (lang === "az" ? "Yoxlanılır..." : "Verifying...") : (lang === "az" ? "Təsdiqlə" : "Verify")}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {currentView === "phone-collection" && (
              <motion.div
                key="phone-collection"
                initial={{ opacity: 0, x: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-5"
              >
                <div className="text-center mb-6">
                  <h4 className="text-xl font-bold text-brand-dark tracking-tight">
                    {lang === "az" ? "Nömrənizi daxil edin" : "Enter your phone"}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    {lang === "az" 
                      ? "Təhlükəsizlik və daha yaxşı təcrübə üçün nömrənizi təsdiq edin." 
                      : "For security and a better experience, please verify your phone."}
                  </p>
                </div>

                <form onSubmit={handleSendPhoneOTP} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                      {lang === "az" ? "Mobil Nömrə" : "Phone Number"}
                    </label>
                    <input
                      type="text"
                      required
                      value={phoneForVerification}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (val.length === 1 && /[0-9]/.test(val)) {
                          val = "+994" + val;
                        }
                        setPhoneForVerification(val);
                      }}
                      placeholder="+994501234567"
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red transition-all placeholder:text-gray-400"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || phoneForVerification.length < 5}
                    className="w-full py-3.5 bg-brand-dark hover:bg-black text-white rounded-xl text-sm font-semibold shadow-xl shadow-brand-dark/10 transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
                  >
                    {loading ? (lang === "az" ? "Göndərilir..." : "Sending...") : (lang === "az" ? "Kodu Göndər" : "Send Code")}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => {
                    if (pendingAuth) {
                      onLoginSuccess(pendingAuth.token, pendingAuth.user);
                    }
                    onClose();
                  }}
                  className="w-full py-3 bg-white text-gray-500 hover:text-brand-dark hover:bg-gray-50 border border-transparent hover:border-gray-200 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  {lang === "az" ? "Daha sonra" : "Skip for now"}
                </button>
              </motion.div>
            )}

            {currentView === "phone-otp" && (
              <motion.div
                key="phone-otp"
                initial={{ opacity: 0, x: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-5"
              >
                <div className="text-center mb-6">
                  <h4 className="text-xl font-bold text-brand-dark tracking-tight">
                    {lang === "az" ? "Kodu daxil edin" : "Enter the code"}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    {lang === "az" ? "Nömrənizə göndərilən 6 rəqəmli kodu daxil edin" : "Enter the 6-digit code sent to your phone"}
                  </p>
                </div>

                <form onSubmit={handleVerifyPhoneOTP} className="space-y-4">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={phoneOtpCode}
                    onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-center text-lg tracking-[0.5em] font-bold focus:outline-none focus:ring-2 focus:ring-brand-red/30 focus:border-brand-red transition-all placeholder:text-gray-300"
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setCurrentView("phone-collection"); setError(""); setSuccess(""); }}
                      className="py-3.5 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <button
                      type="submit"
                      disabled={loading || phoneOtpCode.length < 4}
                      className="flex-1 py-3.5 bg-brand-dark hover:bg-black text-white rounded-xl text-sm font-semibold shadow-xl shadow-brand-dark/10 transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
                    >
                      {loading ? (lang === "az" ? "Yoxlanılır..." : "Verifying...") : (lang === "az" ? "Təsdiqlə" : "Verify")}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
      </motion.div>
    </motion.div>
  );
}
