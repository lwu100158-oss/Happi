import React from "react";
import { Plus, Bell, Cloud, LogIn } from "lucide-react";
import { APPWRITE_CONFIG } from "../appwrite";
import { HappiLogo } from "./HappiLogo";

interface HeaderProps {
  isGuest?: boolean;
  onLoginClick?: () => void;
  onOpenCreatePost: () => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  selectedHashtag: string | null;
  onClearHashtagFilter: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isGuest = false,
  onLoginClick,
  onOpenCreatePost,
  unreadNotificationsCount,
  onOpenNotifications,
  selectedHashtag,
  onClearHashtagFilter,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-emerald-100 shadow-xs px-4 py-3 transition-all">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        {/* Left: Brand Logo & Appwrite indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 cursor-pointer select-none" onClick={onClearHashtagFilter}>
            <HappiLogo size="md" />
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200/80" title={`Appwrite Project: ${APPWRITE_CONFIG.projectName}`}>
            <Cloud className="w-3 h-3 text-emerald-600" />
            <span>{APPWRITE_CONFIG.projectName}</span>
          </div>

          {selectedHashtag && (
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full border border-emerald-200 animate-fadeIn">
              <span>#{selectedHashtag}</span>
              <button
                onClick={onClearHashtagFilter}
                className="ml-1 text-emerald-500 hover:text-emerald-800 font-bold"
                title="清除標籤篩選"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-full text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
            title="通知中心"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </button>

          {/* Create Post "+" OR Guest Login/Register Button */}
          {isGuest ? (
            <button
              onClick={onLoginClick}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-full shadow-sm shadow-emerald-200 transition-all cursor-pointer"
              title="前往登入或註冊帳號"
            >
              <LogIn className="w-4 h-4" />
              <span>登入/註冊</span>
            </button>
          ) : (
            <button
              onClick={onOpenCreatePost}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-semibold px-3.5 py-2 rounded-full shadow-sm shadow-emerald-200 transition-all cursor-pointer"
              title="發布新貼文"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">發帖</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
