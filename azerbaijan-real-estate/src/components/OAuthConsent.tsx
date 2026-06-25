import React, { useState, useEffect } from "react";
import { Mail, Shield, Check, X, Lock, AlertTriangle, ArrowRight, Phone } from "lucide-react";
import { motion } from "motion/react";
import { getApiUrl } from "../utils/api";

interface OAuthConsentProps {
  lang: "az" | "en" | "ru";
  onLoginSuccess: (token: string, user: any) => void;
  currentUser: any;
}

export default function OAuthConsent({ lang, onLoginSuccess, currentUser }: OAuthConsentProps) {
  const [params, setParams] = useState({
    clientId: "",
    redirectUri: "",
    responseType: "",
    scope: "",
    state: "",
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  // Parse query parameters on load
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setParams({
      clientId: searchParams.get("client_id") || "Unknown Client",
      redirectUri: searchParams.get("redirect_uri") || "",
      responseType: searchParams.get("response_type") || "code",
      scope: searchParams.get("scope") || "profile openid",
      state: searchParams.get("state") || "",
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
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
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err: any) {
      setError("Server connection error: " + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorize = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError("");

    try {
      // Standard OAuth Authorization Grant
      // We generate a secure authorization code on backend or mock a compliant one
      const mockCode = `auth_code_${Math.random().toString(36).substring(2, 15)}`;
      
      // Save authorization code to backend if needed, or simply pass it to standard redirect_uri
      if (params.redirectUri) {
        setAuthSuccess(true);
        const redirectUrl = new URL(params.redirectUri);
        redirectUrl.searchParams.set("code", mockCode);
        if (params.state) {
          redirectUrl.searchParams.set("state", params.state);
        }
        
        // Stagger redirect for a premium user experience
        setTimeout(() => {
          window.location.href = redirectUrl.toString();
        }, 1500);
      } else {
        setError(lang === "az" ? "Yönləndirmə URI tapılmadı." : "No Redirect URI provided.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to authorize");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (params.redirectUri) {
      const redirectUrl = new URL(params.redirectUri);
      redirectUrl.searchParams.set("error", "access_denied");
      if (params.state) {
        redirectUrl.searchParams.set("state", params.state);
      }
      window.location.href = redirectUrl.toString();
    } else {
      setError(lang === "az" ? "Geri yönləndirmə mümkün deyil." : "Cannot redirect back.");
    }
  };

  const getScopesList = () => {
    const rawScopes = params.scope.split(/[\s,+]+/);
    return rawScopes.map((s) => {
      const name = s.trim();
      if (!name) return null;
      switch (name) {
        case "profile":
          return {
            title: lang === "az" ? "Profil məlumatları" : "Profile Information",
            desc: lang === "az" ? "Ad, soyad və profil şəklinə daxil olmaq" : "Access your name, profile photo and identifier",
          };
        case "email":
          return {
            title: lang === "az" ? "E-poçt ünvanı" : "Email Address",
            desc: lang === "az" ? "Əsas e-poçt ünvanınızı oxumaq" : "Read your primary email address",
          };
        case "listings":
          return {
            title: lang === "az" ? "Elanların idarə edilməsi" : "Manage Listings",
            desc: lang === "az" ? "Əmlak elanlarınızı yaratmaq, redaktə etmək və silmək" : "Create, edit and delete your property listings",
          };
        case "tickets":
          return {
            title: lang === "az" ? "Dəstək biletləri" : "Support Tickets",
            desc: lang === "az" ? "Dəstək biletlərinizi idarə etmək və cavablandırmaq" : "Manage and reply to support service requests",
          };
        default:
          return {
            title: name,
            desc: lang === "az" ? "Bu tətbiq üçün fərdi icazə" : `Custom permission requested for ${name}`,
          };
      }
    }).filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-brand-dark to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg bg-white rounded-3xl border border-gray-100 shadow-2xl relative overflow-hidden z-10"
      >
        <div className="h-2 bg-gradient-to-r from-brand-red via-red-500 to-red-800" />

        {authSuccess ? (
          <div className="p-8 text-center space-y-6 py-16">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto border-2 border-green-500">
              <Check className="text-green-500" size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-brand-dark">
                {lang === "az" ? "İcazə Verildi!" : "Authorization Successful!"}
              </h3>
              <p className="text-sm text-gray-500">
                {lang === "az"
                  ? "Tətbiqə uğurla səlahiyyət verildi. İndi yönləndirilirsiniz..."
                  : "The application was successfully authorized. Redirecting you back..."}
              </p>
            </div>
            <div className="inline-block animate-pulse text-xs text-brand-red font-bold">
              {params.redirectUri || "redirecting..."}
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-extrabold text-brand-dark tracking-tight">
                MYDOM<span className="text-brand-red">.AZ</span>
              </h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                {lang === "az" ? "TƏHLÜKƏSİZ OAUTH XİDMƏTİ" : "SECURE OAUTH SERVICE"}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-brand-red text-brand-red text-xs font-bold rounded-r flex items-start gap-2.5">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {!currentUser ? (
              <div className="space-y-6">
                <div className="text-center bg-gray-50 rounded-2xl p-5 border-2 border-gray-100">
                  <Shield size={24} className="text-brand-red mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-brand-dark mb-1">
                    {lang === "az" ? "Davam Etmək Üçün Daxil Olun" : "Sign In to Continue"}
                  </h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {lang === "az"
                      ? `"${params.clientId}" tətbiqinə icazə vermək üçün əvvəlcə MYDOM hesabınıza daxil olmalısınız.`
                      : `To grant authorization to "${params.clientId}", please sign in with your MYDOM account.`}
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
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
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      {lang === "az" ? "Şifrə" : "Password"}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Lock size={16} />
                      </div>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:border-brand-red focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-brand-red hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? "..." : lang === "az" ? "Daxil Ol və Səlahiyyət Ver" : "Sign In & Continue"}
                    <ArrowRight size={16} />
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Request Banner */}
                <div className="p-4 bg-brand-red/5 border border-brand-red/10 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-brand-red/10 rounded-xl text-brand-red">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-brand-dark uppercase tracking-wider">
                      {lang === "az" ? "İCAZƏ SORĞUSU" : "PERMISSION REQUEST"}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-extrabold text-brand-dark">"{params.clientId}"</span>{" "}
                      {lang === "az"
                        ? "tətbiqi MYDOM hesabınıza daxil olmaq icazəsi istəyir:"
                        : "is requesting permission to access your MYDOM account:"}
                    </p>
                  </div>
                </div>

                {/* Requested Scopes */}
                <div className="space-y-3">
                  <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    {lang === "az" ? "TƏLƏB OLUNAN İCAZƏLƏR" : "REQUESTED PERMISSIONS"}
                  </h5>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 divide-y divide-gray-100 space-y-3">
                    {getScopesList().map((s, idx) => (
                      <div key={idx} className={`flex gap-3 items-start ${idx > 0 ? "pt-3" : ""}`}>
                        <div className="p-1 bg-green-50 border border-green-100 rounded-lg text-green-600 mt-0.5">
                          <Check size={12} />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-brand-dark">{s?.title}</p>
                          <p className="text-[11px] text-gray-400 font-medium leading-relaxed">{s?.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active user status bar */}
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-400 font-bold">
                    {lang === "az" ? "Hesab:" : "Signed in as:"}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-brand-red text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {currentUser.fullName[0]}
                    </div>
                    <span className="font-extrabold text-brand-dark">{currentUser.fullName}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <X size={16} />
                    {lang === "az" ? "İmtina" : "Cancel"}
                  </button>
                  <button
                    onClick={handleAuthorize}
                    disabled={loading}
                    className="flex-1 py-3 bg-brand-red hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Shield size={16} />
                    {loading ? "..." : lang === "az" ? "İcazə Ver" : "Authorize"}
                  </button>
                </div>
              </div>
            )}

            {/* Footer security badge */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-center flex items-center justify-center gap-1 text-[10px] text-gray-400 font-bold">
              <Shield size={12} className="text-green-500" />
              <span>{lang === "az" ? "Şifrələnmiş Təhlükəsiz Giriş" : "End-to-End Secure Authorization"}</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
