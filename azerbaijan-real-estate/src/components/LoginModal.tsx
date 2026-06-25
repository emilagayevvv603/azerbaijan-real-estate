import React, { useState } from "react";
import { TRANSLATIONS } from "../data/translations";
import { X, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getApiUrl } from "../utils/api";

interface LoginModalProps {
  lang: "az" | "en" | "ru";
  onClose: () => void;
  onLoginSuccess: (token: string, user: any) => void;
}

export default function LoginModal({ lang, onClose, onLoginSuccess }: LoginModalProps) {
  const t = TRANSLATIONS[lang];
  const [authMode, setAuthMode] = useState<"email" | "phone" | "forgot">("email");
  const [emailSubMode, setEmailSubMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("+994 ");
  const [phone, setPhone] = useState("+994 ");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // For phone OTP flow: 1=send, 2=verify
  const [error, setError] = useState("");

  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [customGoogleName, setCustomGoogleName] = useState("");
  const [showCustomGoogleForm, setShowCustomGoogleForm] = useState(false);

  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      setError(lang === "az" ? "Zəhmət olmasa bütün sahələri doldurun" : "Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(getApiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, phone: registerPhone }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        onLoginSuccess(data.token, data.user);
        onClose();
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err: any) {
      setError("Server connection error: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(lang === "az" ? "E-poçt və şifrə daxil edin" : "Please fill in email and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        onLoginSuccess(data.token, data.user);
        onClose();
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err: any) {
      setError("Server connection error: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 9) {
      setError(lang === "az" ? "Düzgün telefon nömrəsi daxil edin" : "Please specify a correct phone number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`${data.message}. Test: ${data.demoCode}`);
        setStep(2);
      } else {
        setError(data.error || "Failed to send code");
      }
    } catch (err: any) {
      setError("SMS Service offline: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) {
      setError(lang === "az" ? "OTP kodu daxil edin" : "Please enter OTP code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(getApiUrl("/api/auth/verify-phone"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otpCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Auto sign-in verified user
        const loginRes = await fetch(getApiUrl("/api/auth/login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: `${phone.replace(/\s+/g, "")}@mydom.az`, password: "otp-verified-login" }),
        });
        const loginData = await loginRes.json();
        onLoginSuccess(loginData.token, loginData.user);
        onClose();
      } else {
        setError(data.error || t.invalidOTP);
      }
    } catch (err: any) {
      setError("Verification failed: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSignIn = async (provider: "google" | "apple", selectedEmail?: string, selectedName?: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(getApiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, email: selectedEmail, fullName: selectedName }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        onLoginSuccess(data.token, data.user);
        onClose();
      } else {
        setError("Provider sign-in failed: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      setError("OAuth servers offline: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (channel: "sms" | "email") => {
    const target = channel === "email" ? email : phone;
    if (!target || target === "+994 ") {
      setError(lang === "az" ? "Xahiş edirik, bərpa üçün məlumat daxil edin" : "Please fill in email or phone first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(getApiUrl("/api/auth/recover"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, target }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(data.message);
      } else {
        setError(data.error || "Recovery failed");
      }
    } catch (err) {
      setError("Recovery dispatch failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 140, damping: 20 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-md relative overflow-hidden transform"
      >
        
        {/* Banner */}
        <div className="h-2 bg-gradient-to-r from-brand-red via-red-500 to-red-800" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition p-1.5 rounded-full hover:bg-gray-100 cursor-pointer z-10"
        >
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-extrabold text-brand-dark tracking-tight">
              MYDOM<span className="text-brand-red">.AZ</span>
            </h3>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-brand-red text-brand-red text-xs font-bold rounded-r">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 text-xs font-bold rounded-r">
              {success}
            </div>
          )}

          {showGoogleChooser ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center">
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  className="h-10 w-10 mb-2 animate-pulse"
                  alt="Google"
                />
                <h4 className="text-lg font-bold text-gray-800">
                  {lang === "az" ? "Google ilə daxil olun" : lang === "en" ? "Sign in with Google" : "Войти через Google"}
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  {lang === "az" ? "MYDOM.AZ tətbiqinə keçid etmək üçün hesab seçin" : lang === "en" ? "Choose an account to continue to MYDOM.AZ" : "Выберите аккаунт для входа в MYDOM.AZ"}
                </p>
              </div>

              {showCustomGoogleForm ? (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!customGoogleEmail || !customGoogleName) {
                    setError(lang === "az" ? "Zəhmət olmasa bütün sahələri doldurun" : "Please fill in all fields");
                    return;
                  }
                  handleProviderSignIn("google", customGoogleEmail, customGoogleName);
                }} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{lang === "az" ? "E-poçt ünvanınız" : "Email address"}</label>
                    <input
                      type="email"
                      required
                      placeholder="example@gmail.com"
                      value={customGoogleEmail}
                      onChange={(e) => setCustomGoogleEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-semibold focus:outline-none focus:border-brand-red focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">{lang === "az" ? "Adınız və Soyadınız" : "Your Full Name"}</label>
                    <input
                      type="text"
                      required
                      placeholder="Elcan Əlizadə"
                      value={customGoogleName}
                      onChange={(e) => setCustomGoogleName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-semibold focus:outline-none focus:border-brand-red focus:bg-white transition"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCustomGoogleForm(false)}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition"
                    >
                      {lang === "az" ? "Geri" : "Back"}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 bg-brand-red hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md transition"
                    >
                      {loading ? (lang === "az" ? "Yüklənir..." : "Loading...") : (lang === "az" ? "Daxil ol" : "Sign In")}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2.5">
                  {/* Option 1: Admin Account */}
                  <button
                    type="button"
                    onClick={() => handleProviderSignIn("google", "eljanalizada2@gmail.com", "Elcan Əlizadə")}
                    className="w-full p-3.5 border border-gray-200 hover:bg-gray-50 rounded-2xl flex items-center justify-between text-left transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center font-extrabold text-sm">
                        E
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-800 group-hover:text-brand-red transition">Elcan Əlizadə</div>
                        <div className="text-xs text-gray-400">eljanalizada2@gmail.com</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-brand-red bg-red-50 px-2 py-0.5 rounded-full uppercase">
                      Admin
                    </span>
                  </button>

                  {/* Option 2: Guest Account */}
                  <button
                    type="button"
                    onClick={() => handleProviderSignIn("google", "client-user@mydom.az", "Müştəri Qonaq")}
                    className="w-full p-3.5 border border-gray-200 hover:bg-gray-50 rounded-2xl flex items-center justify-between text-left transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-extrabold text-sm">
                        Q
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-800 group-hover:text-brand-red transition">Müştəri Qonaq</div>
                        <div className="text-xs text-gray-400">client-user@mydom.az</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                      Müştəri
                    </span>
                  </button>

                  {/* Option 3: Use custom account */}
                  <button
                    type="button"
                    onClick={() => {
                      setCustomGoogleEmail("");
                      setCustomGoogleName("");
                      setShowCustomGoogleForm(true);
                    }}
                    className="w-full p-3.5 border border-dashed border-gray-300 hover:border-brand-red hover:bg-red-50/10 rounded-2xl flex items-center gap-3 text-left transition"
                  >
                    <div className="w-9 h-9 rounded-full border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-lg font-bold">
                      +
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-700">{lang === "az" ? "Başqa hesab istifadə et" : "Use another account"}</div>
                      <div className="text-xs text-gray-400">{lang === "az" ? "İstədiyiniz Gmail ünvanı ilə daxil olun" : "Login with any custom Gmail address"}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowGoogleChooser(false)}
                    className="w-full py-2.5 mt-4 text-xs font-bold text-gray-400 hover:text-gray-650 transition text-center"
                  >
                    {lang === "az" ? "Ləğv et" : "Cancel"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Tab Selector */}
              {authMode !== "forgot" && (
                <div className="flex border-b border-gray-100 mb-6">
                  <button
                    onClick={() => { setAuthMode("email"); setError(""); setSuccess(""); }}
                    className={`flex-1 pb-3 text-sm font-bold border-b-2 transition ${
                      authMode === "email"
                        ? "border-brand-red text-brand-red"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {t.emailLoginLabel}
                  </button>
                  <button
                    onClick={() => { setAuthMode("phone"); setStep(1); setError(""); setSuccess(""); }}
                    className={`flex-1 pb-3 text-sm font-bold border-b-2 transition ${
                      authMode === "phone"
                        ? "border-brand-red text-brand-red"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {t.phoneLoginLabel}
                  </button>
                </div>
              )}

          {/* EMAIL MODE */}
          {authMode === "email" && (
            <div className="space-y-4">
              {/* Login / Register Toggle */}
              <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-2 border-2 border-gray-100">
                <button
                  type="button"
                  onClick={() => { setEmailSubMode("login"); setError(""); setSuccess(""); }}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer ${
                    emailSubMode === "login"
                      ? "bg-white text-brand-dark shadow-sm border border-gray-100/50"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {lang === "az" ? "DAXİL OL" : "LOGIN"}
                </button>
                <button
                  type="button"
                  onClick={() => { setEmailSubMode("register"); setError(""); setSuccess(""); }}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition cursor-pointer ${
                    emailSubMode === "register"
                      ? "bg-white text-brand-dark shadow-sm border border-gray-100/50"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {lang === "az" ? "YENİ QEYDİYYAT" : "REGISTER"}
                </button>
              </div>

              {emailSubMode === "login" ? (
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-brand-red focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        {t.passwordLabel}
                      </label>
                      <button
                        type="button"
                        onClick={() => { setAuthMode("forgot"); setError(""); setSuccess(""); }}
                        className="text-xs text-brand-red font-bold hover:underline cursor-pointer"
                      >
                        {t.forgotPass}
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-brand-red focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-brand-red hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "..." : t.loginBtn}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleEmailRegister} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      {lang === "az" ? "Ad-Soyad" : "Full Name"}
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Elcan Əlizadə"
                      className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-brand-red focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-brand-red focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      {lang === "az" ? "Telefon Nömrəsi" : "Phone Number"}
                    </label>
                    <input
                      type="text"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(e.target.value)}
                      placeholder="+994 50 123 45 67"
                      className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-brand-red focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      {lang === "az" ? "Şifrə" : "Password"}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-brand-red focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-brand-red hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "..." : (lang === "az" ? "Qeydiyyatdan Keç" : "Sign Up")}
                  </button>
                </form>
              )}

              {/* Toggle text link */}
              <div className="text-center mt-3 text-xs font-bold text-gray-400">
                {emailSubMode === "login" ? (
                  <>
                    {lang === "az" ? "Hələ də hesabınız yoxdur?" : "Don't have an account?"}{" "}
                    <button
                      type="button"
                      onClick={() => { setEmailSubMode("register"); setError(""); setSuccess(""); }}
                      className="text-brand-red hover:underline font-extrabold cursor-pointer"
                    >
                      {lang === "az" ? "Qeydiyyatdan keçin" : "Sign up now"}
                    </button>
                  </>
                ) : (
                  <>
                    {lang === "az" ? "Artıq hesabınız var?" : "Already have an account?"}{" "}
                    <button
                      type="button"
                      onClick={() => { setEmailSubMode("login"); setError(""); setSuccess(""); }}
                      className="text-brand-red hover:underline font-extrabold cursor-pointer"
                    >
                      {lang === "az" ? "Daxil olun" : "Login here"}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* PHONE MODE WITH OTP */}
          {authMode === "phone" && (
            <div className="space-y-4">
              {step === 1 ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      {lang === "az" ? "Telefon nömrəsi" : "Phone Number"}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Phone size={16} />
                      </div>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+994 50 123 45 67"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-brand-red focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-brand-red hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition disabled:opacity-50"
                  >
                    {loading ? "..." : lang === "az" ? "OTP Kodunu Gönder" : "Send OTP Code"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      {t.smsOtpLabel} (Demo code: 1918)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <ShieldCheck size={16} />
                      </div>
                      <input
                        type="text"
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="e.g. 1918"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium text-center tracking-widest text-lg font-bold focus:outline-none focus:border-brand-red focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-sm font-bold transition"
                    >
                      {lang === "az" ? "Geri" : "Back"}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 bg-brand-red hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md transition disabled:opacity-50"
                    >
                      {loading ? "..." : t.verifyBtn}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* FORGOT PASSWORD MODE WITH BOTH CHANNELS */}
          {authMode === "forgot" && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-brand-red bg-red-50 p-3 rounded-xl mb-2">
                <HelpCircle size={18} />
                <span className="text-xs font-bold">
                  {lang === "az" ? "Şifrənin təhlükəsiz bərpası" : "Secure Password Recovery"}
                </span>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                {lang === "az"
                  ? "Sıfırlama linki almaq üçün e-poçtunuzu və ya telefon nömrənizi daxil edərək müvafiq bərpa kanalını seçin."
                  : "To obtain a secure recovery link, specify your details and choose the respective dispatch channel."}
              </p>

              <div className="space-y-3">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-poçt ünvanınız"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-brand-red focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleRecovery("email")}
                    className="w-full mt-2 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition"
                  >
                    {lang === "az" ? "E-poçt ilə bərpa linki göndər" : "Send reset link via Email"}
                  </button>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Telefon nömrəniz"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-brand-red focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleRecovery("sms")}
                    className="w-full mt-2 py-2 bg-brand-red/10 hover:bg-brand-red/20 text-brand-red rounded-lg text-xs font-bold transition"
                  >
                    {lang === "az" ? "SMS ilə bərpa linki göndər" : "Send reset link via SMS"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setAuthMode("email"); setError(""); setSuccess(""); }}
                className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-sm font-bold transition text-center block"
              >
                {lang === "az" ? "Giriş ekranına qayıt" : "Return to login"}
              </button>
            </div>
          )}

          {/* Social login option bars */}
          {authMode !== "forgot" && (
            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
              <div className="relative flex justify-center text-xs uppercase font-bold text-gray-400 mb-2">
                <span className="bg-white px-3 relative z-10">{t.orLabel}</span>
                <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gray-100 -z-0" />
              </div>

              <button
                type="button"
                onClick={() => { setShowGoogleChooser(true); setError(""); setSuccess(""); }}
                className="w-full py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition cursor-pointer"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  className="h-4 w-4"
                  alt="Google icon"
                />
                <span>Google Play / Google</span>
              </button>

              <div className="mt-4 text-center">
                <p className="text-[10px] text-gray-400 font-medium">
                  © 2026 MYDOM.AZ. All rights reserved.
                </p>
              </div>
            </div>
          )}
        </>
      )}

        </div>
      </motion.div>
    </div>
  );
}
