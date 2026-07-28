import React, { useState } from "react";
import { LogIn, ArrowRight, ShieldCheck, X, Sparkles, Clock, Lock, Upload, Camera, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { HappiLogo } from "./HappiLogo";
import { User, TimeLimitCycle, TimeLimitConfig } from "../types";
import { compressImage, validateTimeLimitMinutes, getTimeLimitBounds, CYCLE_NAMES } from "../utils";
import { saveUserToFirestore, fetchAllUsersFromFirestore } from "../services/firestoreService";

import smilingUserImg from "../assets/images/happi_user_smiling_1785137203160.jpg";
import readingUserImg from "../assets/images/happi_user_reading_1785137222198.jpg";
import secureChatImg from "../assets/images/happi_secure_chat_1785137238132.jpg";

interface LandingPageProps {
  onLogin: (userProfile?: Partial<User>) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "profile_setup">("login");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Time Limit states
  const [timeLimitEnabled, setTimeLimitEnabled] = useState(true);
  const [timeLimitCycle, setTimeLimitCycle] = useState<TimeLimitCycle>("1h");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(30);

  // Default Guest Avatar URL
  const DEFAULT_GUEST_AVATAR = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";

  // Demo user database stored in localStorage
  const getRegisteredUsers = (): any[] => {
    try {
      const saved = localStorage.getItem("happi_registered_users");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default demo user account
    return [
      {
        id: "u_demo",
        username: "user",
        email: "user@happi.com",
        password: "password",
        name: "Happi 探索者",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        birthDate: "2000-01-01",
        isGuest: false,
      }
    ];
  };

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);

    try {
      let users = getRegisteredUsers();
      const inputAccount = email.trim().toLowerCase();

      // Check local storage users first
      let matchedUser = users.find(
        (u) =>
          (u.username && u.username.toLowerCase() === inputAccount) ||
          (u.email && u.email.toLowerCase() === inputAccount)
      );

      // If not in local storage, check Cloud Firestore!
      if (!matchedUser) {
        const cloudUsers = await fetchAllUsersFromFirestore();
        if (cloudUsers && cloudUsers.length > 0) {
          matchedUser = cloudUsers.find(
            (u) =>
              (u.username && u.username.toLowerCase() === inputAccount) ||
              (u.email && u.email.toLowerCase() === inputAccount)
          );

          if (matchedUser) {
            // Save synced user to local storage for future fast logins
            const updatedUsers = [...users, matchedUser];
            localStorage.setItem("happi_registered_users", JSON.stringify(updatedUsers));
          }
        }
      }

      if (!matchedUser) {
        setLoginError("查無此帳戶！請確認輸入的帳號/信箱，或點擊下方「立即註冊」。");
        setIsLoggingIn(false);
        return;
      }

      // Check password if available
      if (matchedUser.password && password && matchedUser.password !== password) {
        setLoginError("密碼錯誤，請重新輸入！");
        setIsLoggingIn(false);
        return;
      }

      // Pass the existing matched account data
      onLogin({
        id: matchedUser.id,
        username: matchedUser.username,
        name: matchedUser.name || matchedUser.username,
        avatar: matchedUser.avatar || DEFAULT_GUEST_AVATAR,
        birthDate: matchedUser.birthDate || "2000-01-01",
        timeLimit: matchedUser.timeLimit,
        isGuest: false,
        hasCompletedBirthDatePrompt: true,
      });
    } catch (err) {
      console.error("Login process error:", err);
      setLoginError("登入過程發生異常，請重試");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Register Step 1
  const handleRegisterStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMode("profile_setup");
  };

  // Handle Avatar Image Upload with Compression
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      // Front-end Canvas Compression before saving
      const compressedDataUrl = await compressImage(file, 400, 400, 0.85);
      setAvatarUrl(compressedDataUrl);
    } catch (error) {
      console.error("Avatar compression failed:", error);
    } finally {
      setIsCompressing(false);
    }
  };

  // State to trigger birthday warning
  const [showBirthdayWarningNotice, setShowBirthdayWarningNotice] = useState(false);

  // Handle Profile Setup Complete
  const handleProfileSetupComplete = (e: React.FormEvent) => {
    e.preventDefault();

    if (timeLimitEnabled) {
      const timeLimitError = validateTimeLimitMinutes(timeLimitCycle, Number(timeLimitMinutes));
      if (timeLimitError) {
        alert(`時限設定有誤：${timeLimitError}`);
        return;
      }
    }

    const finalBirthDate = birthDate ? birthDate : null;
    const finalAvatar = avatarUrl || DEFAULT_GUEST_AVATAR;
    const finalName = displayName || username || "Happi 會員";

    const timeLimitConfig: TimeLimitConfig = {
      enabled: timeLimitEnabled,
      cycle: timeLimitCycle,
      limitMinutes: timeLimitEnabled ? Number(timeLimitMinutes) : 0,
      usedMinutes: 0,
      cycleStartTime: new Date().toISOString(),
    };

    const newUserObj: User = {
      id: `u_${Date.now()}`,
      username: username || "happi_member",
      email: email || `${username}@happi.com`,
      password: password || "123456",
      name: finalName,
      avatar: finalAvatar,
      birthDate: finalBirthDate,
      registeredAt: new Date().toISOString(),
      hasCompletedBirthDatePrompt: true,
      isGuest: false,
      timeLimit: timeLimitConfig,
    };

    // Save user to registered users list in localStorage & Firestore
    try {
      const existingUsers = getRegisteredUsers();
      existingUsers.push(newUserObj);
      localStorage.setItem("happi_registered_users", JSON.stringify(existingUsers));
      saveUserToFirestore(newUserObj);
    } catch (e) {
      console.error(e);
    }

    onLogin({
      id: newUserObj.id,
      username: newUserObj.username,
      name: newUserObj.name,
      avatar: newUserObj.avatar,
      birthDate: newUserObj.birthDate,
      timeLimit: newUserObj.timeLimit,
      hasCompletedBirthDatePrompt: true,
      registeredAt: new Date().toISOString(),
      isGuest: false,
    });
  };

  // Quick Guest Login (Will NOT ask for birthday or avatar)
  const handleGuestLogin = () => {
    onLogin({
      username: "happi_guest",
      name: "訪客",
      avatar: DEFAULT_GUEST_AVATAR,
      birthDate: null,
      isGuest: true,
      hasCompletedBirthDatePrompt: true,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between font-sans">
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <HappiLogo size="md" />
          </div>

          <button
            onClick={() => {
              setAuthMode("login");
              setShowAuthModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-full shadow-xs transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>立即登入</span>
          </button>
        </div>
      </header>

      {/* Main Container - Vertical layout */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-6 flex flex-col items-center space-y-7">
        
        {/* Brand Headline */}
        <section className="text-center space-y-4 w-full pt-1">
          <div className="flex justify-center pb-1">
            <HappiLogo size="xl" />
          </div>

          <p className="text-base sm:text-lg font-bold text-slate-800 leading-relaxed px-1">
            讓我們重拾前往社群軟體的初衷，<br />
            共同打造新一代健康的社群環境
          </p>

          <div className="pt-1">
            <button
              onClick={() => {
                setAuthMode("login");
                setShowAuthModal(true);
              }}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm rounded-2xl shadow-md shadow-emerald-200 hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <span>立即登入</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Extended Feature Cards Section */}
        <section className="w-full space-y-6">
          {/* Card 1: 更適合你的內容 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[300px] relative overflow-hidden">
            <div className="space-y-2.5 z-10 pb-28">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">
                <Sparkles className="w-3.5 h-3.5" />
                <span>生成式 AI 內容過濾</span>
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                更適合你的內容
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                我們透過生成式AI審核每一則留言和貼文內容，為您保持更適合您的視野。
              </p>
            </div>

            {/* Positioned Image - Natural authentic photo without any AI artifacts */}
            <div className="absolute bottom-0 right-0 w-40 h-36 overflow-hidden rounded-tl-3xl border-t border-l border-emerald-100 shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=600&q=80"
                alt="使用者開心觀看乾淨內容"
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Card 2: 更短的使用，更多的自由 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[320px] relative overflow-hidden">
            <div className="space-y-2.5 z-10 pb-28">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg border border-teal-100">
                <Clock className="w-3.5 h-3.5" />
                <span>健康使用時限</span>
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                更短的使用，更多的自由
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                為自己設下使用時限，讓自己獲得更多自由的時間，我們採用全新的架構，你的時限可以在1小時、3小時和1天更新一次，享有更多的無手機時間吧！
              </p>
            </div>

            {/* Positioned Image */}
            <div className="absolute bottom-0 right-0 w-40 h-36 overflow-hidden rounded-tl-3xl border-t border-l border-teal-100 shadow-xs">
              <img
                src={readingUserImg}
                alt="使用者閱讀書籍"
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          {/* Card 3: 更安全的聊天互動 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[300px] relative overflow-hidden">
            <div className="space-y-2.5 z-10 pb-28">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
                <Lock className="w-3.5 h-3.5" />
                <span>端對端資料保護</span>
              </div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                更安全的聊天互動
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                您可以啟動端對端對話，也可以讓系統進行偵測，即時防止您的個資外洩，我們不會透過生成式AI進行偵測，請您放心使用。
              </p>
            </div>

            {/* Positioned Image - Clean natural messaging photo */}
            <div className="absolute bottom-0 right-0 w-40 h-36 overflow-hidden rounded-tl-3xl border-t border-l border-indigo-100 shadow-xs">
              <img
                src="https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80"
                alt="安全通訊隱私保護"
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        <p className="font-semibold text-slate-500">Happi 社群平台</p>
      </footer>

      {/* Auth Modal Modal Dialog */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-5 relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1 pt-1">
              <div className="flex justify-center">
                <HappiLogo size="lg" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                {authMode === "login" && "登入 Happi 社群帳號"}
                {authMode === "register" && "建立您的 Happi 帳號"}
                {authMode === "profile_setup" && "設定頭像與生日"}
              </h3>
            </div>

            {/* LOGIN MODE */}
            {authMode === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold leading-relaxed">
                    ⚠️ {loginError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    帳號 / 電子郵件
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="輸入帳號或信箱 (測試帳號: user)"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (loginError) setLoginError("");
                    }}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    密碼
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer mt-1 flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? "雲端帳號驗證登入中..." : "登入社群"}
                </button>

                {/* Prompt to Switch to Register */}
                <div className="text-center text-xs text-slate-500 pt-1">
                  沒有帳戶嗎？
                  <button
                    type="button"
                    onClick={() => setAuthMode("register")}
                    className="text-emerald-600 font-bold ml-1 hover:underline cursor-pointer"
                  >
                    立即註冊
                  </button>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-semibold">或</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* Clean Guest Login */}
                <button
                  type="button"
                  onClick={handleGuestLogin}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>訪客快速體驗登入</span>
                </button>
              </form>
            )}

            {/* REGISTER STEP 1 */}
            {authMode === "register" && (
              <form onSubmit={handleRegisterStep1} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    真實姓名 / 社群顯示暱稱
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如: 王小明 / Happi 探索者"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    帳號 (Username)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如: happi_user"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    電子郵件
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    設定密碼
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer mt-1"
                >
                  下一步：設定個人檔案
                </button>

                {/* Prompt to Switch to Login */}
                <div className="text-center text-xs text-slate-500 pt-1">
                  已有帳戶？
                  <button
                    type="button"
                    onClick={() => setAuthMode("login")}
                    className="text-emerald-600 font-bold ml-1 hover:underline cursor-pointer"
                  >
                    立即登入
                  </button>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-[10px] text-slate-400 font-semibold">或</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGuestLogin}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>訪客快速體驗登入</span>
                </button>
              </form>
            )}

            {/* REGISTER STEP 2: PROFILE SETUP (AVATAR & BIRTHDAY) */}
            {authMode === "profile_setup" && (
              <form onSubmit={handleProfileSetupComplete} className="space-y-4">
                {/* Avatar Upload Container */}
                <div className="flex flex-col items-center justify-center space-y-2">
                  <label className="text-xs font-semibold text-slate-700">
                    上傳個人頭像
                  </label>

                  <div className="relative group">
                    <div className="w-20 h-20 rounded-full border-2 border-emerald-400 p-0.5 overflow-hidden bg-slate-100 flex items-center justify-center shadow-inner">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="頭像預覽"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-slate-400" />
                      )}
                    </div>

                    <label className="absolute bottom-0 right-0 p-1.5 bg-emerald-500 text-white rounded-full shadow-md cursor-pointer hover:bg-emerald-600 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {isCompressing && (
                    <span className="text-[10px] text-emerald-600 font-medium animate-pulse">
                      圖片處理壓縮中...
                    </span>
                  )}
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    社群顯示暱稱
                  </label>
                  <input
                    type="text"
                    placeholder="輸入暱稱"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  />
                </div>

                {/* Birthday Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>生日 / 年齡設定 (可跳過)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">選填</span>
                  </div>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-slate-800"
                  />
                </div>

                {/* Birthday Notice & Warning */}
                {!birthDate ? (
                  <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 text-amber-900 text-xs font-medium leading-relaxed space-y-1">
                    <p className="font-bold flex items-center gap-1 text-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>跳過生日設定提醒</span>
                    </p>
                    <p className="text-[11px] text-amber-800/90 leading-normal">
                      若未設定年齡，可能會出現超過您真實年齡層的貼文與留言。若現在跳過，日後至個人檔案補設定時<strong>無需等待人工審查</strong>即可直接設定。
                    </p>
                  </div>
                ) : (
                  <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-2.5 text-emerald-800 text-xs font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>已設定生日，將自動為您過濾不適齡內容。</span>
                  </div>
                )}

                {/* Time Limit Section */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-800">使用時限設定</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={timeLimitEnabled}
                        onChange={(e) => setTimeLimitEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {!timeLimitEnabled ? (
                    <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-3 text-rose-900 text-xs font-medium space-y-1">
                      <p className="font-bold flex items-center gap-1 text-rose-700">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>關閉時限提醒</span>
                      </p>
                      <p className="text-[11px] text-rose-800/90 leading-normal">
                        跳過或關閉使用時限，這可能無法讓您的使用時間受到健康有效的管控。
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          選擇更新週期
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(["1h", "3h", "1d"] as TimeLimitCycle[]).map((c) => {
                            const bounds = getTimeLimitBounds(c);
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  setTimeLimitCycle(c);
                                  // Auto set to a healthy default within bounds
                                  setTimeLimitMinutes(Math.round(bounds.total * 0.5));
                                }}
                                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                  timeLimitCycle === c
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {c === "1h" ? "1 小時" : c === "3h" ? "3 小時" : "1 天"}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        {(() => {
                          const bounds = getTimeLimitBounds(timeLimitCycle);
                          const limitErr = validateTimeLimitMinutes(timeLimitCycle, timeLimitMinutes);
                          return (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <label className="font-bold text-slate-700">
                                  使用時限 (分鐘)
                                </label>
                                <span className="text-[10px] font-semibold text-slate-400">
                                  允許範圍: {bounds.minMinutes} ~ {bounds.maxMinutes} 分鐘
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={bounds.minMinutes}
                                  max={bounds.maxMinutes}
                                  value={timeLimitMinutes}
                                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                                  className={`w-full px-3 py-2 text-xs font-bold bg-white border rounded-xl focus:outline-none focus:ring-2 ${
                                    limitErr
                                      ? "border-red-400 focus:ring-red-400 text-red-600"
                                      : "border-slate-200 focus:ring-indigo-500 text-slate-800"
                                  }`}
                                />
                                <span className="text-xs font-bold text-slate-500 shrink-0">分鐘</span>
                              </div>
                              {limitErr && (
                                <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 pt-0.5">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{limitErr}</span>
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={
                    isCompressing ||
                    (timeLimitEnabled && !!validateTimeLimitMinutes(timeLimitCycle, timeLimitMinutes))
                  }
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer mt-2"
                >
                  完成註冊，進入 Happi 社群
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
