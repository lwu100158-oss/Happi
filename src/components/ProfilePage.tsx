import React, { useState } from "react";
import { User, Post, Comment, TimeLimitConfig, TimeLimitCycle } from "../types";
import {
  Calendar,
  ShieldCheck,
  Bookmark,
  Edit3,
  Sparkles,
  Settings,
  LogOut,
  Trash2,
  AlertTriangle,
  X,
  Clock,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { PostCard } from "./PostCard";
import { BirthDateChangeModal } from "./BirthDateChangeModal";
import { validateTimeLimitMinutes, getTimeLimitBounds, CYCLE_NAMES } from "../utils";

interface ProfilePageProps {
  user: User;
  userPosts: Post[];
  savedPosts: Post[];
  comments: Comment[];
  onOpenBirthDatePrompt: () => void;
  onRequestBirthDateChange: (
    newBirthDate: string,
    reason: string
  ) => Promise<{ approved: boolean; reason: string; accountAgeText?: string }>;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onHashtagClick: (hashtag: string) => void;
  onOpenAppeal: (post: Post) => void;
  onUpdateBio: (newBio: string) => void;
  onLogout: () => void;
  onDeleteAccount?: () => void;
  onUpdateTimeLimit?: (newConfig: TimeLimitConfig) => void;
  onEditPost?: (postId: string, newContent: string, newImageUrl?: string) => void;
  onDeletePost?: (postId: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  user,
  userPosts,
  savedPosts,
  comments,
  onOpenBirthDatePrompt,
  onRequestBirthDateChange,
  onLike,
  onSave,
  onAddComment,
  onHashtagClick,
  onOpenAppeal,
  onUpdateBio,
  onLogout,
  onDeleteAccount,
  onUpdateTimeLimit,
  onEditPost,
  onDeletePost,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"my_posts" | "saved">(
    "my_posts"
  );
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(user.bio || "");
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isBirthChangeModalOpen, setIsBirthChangeModalOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Time Limit Modal state
  const [isTimeLimitModalOpen, setIsTimeLimitModalOpen] = useState(false);
  const [tlEnabled, setTlEnabled] = useState(user.timeLimit?.enabled ?? true);
  const [tlCycle, setTlCycle] = useState<TimeLimitCycle>(user.timeLimit?.cycle ?? "1h");
  const [tlMinutes, setTlMinutes] = useState<number>(user.timeLimit?.limitMinutes ?? 30);

  // Calculate if locked (<= 10 mins remaining)
  const remainingMins = (user.timeLimit?.limitMinutes || 0) - (user.timeLimit?.usedMinutes || 0);
  const isTimeLimitLocked = !!(user.timeLimit?.enabled && remainingMins <= 10 && remainingMins >= 0);

  const handleOpenTimeLimitModal = () => {
    setTlEnabled(user.timeLimit?.enabled ?? true);
    setTlCycle(user.timeLimit?.cycle ?? "1h");
    setTlMinutes(user.timeLimit?.limitMinutes ?? 30);
    setIsSettingsModalOpen(false);
    setIsTimeLimitModalOpen(true);
  };

  const handleSaveTimeLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTimeLimitLocked) {
      alert("使用時間剩餘不足 10 分鐘，暫時無法修改或關閉時限設定。");
      return;
    }

    if (tlEnabled) {
      const err = validateTimeLimitMinutes(tlCycle, Number(tlMinutes));
      if (err) {
        alert(err);
        return;
      }
    }

    const updatedConfig: TimeLimitConfig = {
      enabled: tlEnabled,
      cycle: tlCycle,
      limitMinutes: tlEnabled ? Number(tlMinutes) : 0,
      usedMinutes: user.timeLimit?.usedMinutes || 0,
      cycleStartTime: user.timeLimit?.cycleStartTime || new Date().toISOString(),
    };

    if (onUpdateTimeLimit) {
      onUpdateTimeLimit(updatedConfig);
    }
    setIsTimeLimitModalOpen(false);
  };

  const handleSaveBio = () => {
    onUpdateBio(bioInput);
    setIsEditingBio(false);
  };

  const displayedPosts = activeSubTab === "my_posts" ? userPosts : savedPosts;

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs relative overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 -m-5 mb-0 relative">
          {/* Top-Right Settings Gear Icon Button */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white text-slate-700 rounded-full shadow-xs backdrop-blur-sm transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold"
            title="帳號與個人設定"
          >
            <Settings className="w-4 h-4 text-slate-600" />
            <span className="pr-1 text-slate-700">設定</span>
          </button>
        </div>

        <div className="relative pt-2 flex items-start justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-2xl object-cover shrink-0 ring-4 ring-white shadow-md -mt-8"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-1.5 truncate">
                {user.name}
                <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-500 shrink-0" />
              </h2>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
          {isEditingBio ? (
            <div className="space-y-2">
              <textarea
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditingBio(false)}
                  className="px-3 py-1 text-slate-500 font-medium cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveBio}
                  className="px-3 py-1 bg-emerald-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  儲存簡介
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p>{user.bio || "點擊右側編輯個人簡介..."}</p>
              <button
                onClick={() => setIsEditingBio(true)}
                className="p-1 text-slate-400 hover:text-emerald-600 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Birthdate & Assurance banner */}
        <div className="mt-4 p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              出生日期：<strong className="font-bold">{user.birthDate || "未設定"}</strong>
            </span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">年齡不影響任何服務體驗</span>
        </div>
      </div>

      {/* Sub Tabs: My Posts vs Saved */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-100 flex items-center gap-1 shadow-xs">
        <button
          onClick={() => setActiveSubTab("my_posts")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === "my_posts"
              ? "bg-emerald-500 text-white shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>我的貼文</span>
          <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">
            {userPosts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("saved")}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeSubTab === "saved"
              ? "bg-emerald-500 text-white shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>儲存紀錄</span>
          <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">
            {savedPosts.length}
          </span>
        </button>
      </div>

      {/* Feed List */}
      <div className="space-y-4">
        {displayedPosts.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl text-center border border-slate-100 text-slate-400 space-y-1">
            <p className="text-xs font-medium">
              {activeSubTab === "my_posts" ? "您尚未發布任何貼文" : "您尚未儲存任何貼文紀錄"}
            </p>
          </div>
        ) : (
          displayedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              comments={comments.filter((c) => c.postId === post.id)}
              userBirthDate={user.birthDate}
              currentUserId={user.id}
              currentUserIsAdmin={user.username === "admin" || user.id === "admin" || user.email === "admin@happi.com"}
              onLike={onLike}
              onSave={onSave}
              onAddComment={onAddComment}
              onHashtagClick={onHashtagClick}
              onOpenAppeal={onOpenAppeal}
              onEditPost={onEditPost}
              onDeletePost={onDeletePost}
            />
          ))
        )}
      </div>

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-100 shadow-xl relative animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">帳號與隱私設定</h3>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Birth Date Option */}
              <button
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  setIsBirthChangeModalOpen(true);
                }}
                className="w-full p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-emerald-300 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700 hover:text-emerald-800 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>
                    {!user.birthDate ? "補設定生日年齡 (免待審查)" : "申請變更生日 (經 AI 審核)"}
                  </span>
                </div>
                <span className={`text-[11px] font-medium ${!user.birthDate ? "text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200" : "text-slate-500"}`}>
                  {!user.birthDate ? "未設定" : user.birthDate}
                </span>
              </button>

              {/* Time Limit Setting Option */}
              <div className="space-y-1">
                <button
                  onClick={handleOpenTimeLimitModal}
                  className="w-full p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-300 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700 hover:text-indigo-800 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span>健康使用時限設定</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isTimeLimitLocked && <Lock className="w-3.5 h-3.5 text-amber-600" />}
                    <span className="text-[11px] font-normal text-slate-500">
                      {user.timeLimit?.enabled
                        ? `${user.timeLimit.limitMinutes}分鐘 / ${user.timeLimit.cycle === "1h" ? "1小時" : user.timeLimit.cycle === "3h" ? "3小時" : "1天"}`
                        : "未開啟"}
                    </span>
                  </div>
                </button>
                {isTimeLimitLocked && (
                  <p className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 rounded-xl p-2 flex items-center gap-1 leading-normal">
                    <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>時限剩餘不足 10 分鐘，暫時無法修改或關閉設定。</span>
                  </p>
                )}
              </div>

              {/* Logout Option */}
              <button
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  onLogout();
                }}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <LogOut className="w-4 h-4 text-slate-600" />
                  <span>登出帳號</span>
                </div>
              </button>

              {/* Delete Account Option */}
              {isConfirmingDelete ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-2xl space-y-2.5 animate-fadeIn">
                  <div className="flex items-start gap-2 text-red-700 text-xs font-bold leading-relaxed">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <span>確定要刪除帳戶嗎？此操作將永久清除您的個人檔案與歷史資料且無法復原。</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setIsConfirmingDelete(false)}
                      className="flex-1 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        setIsSettingsModalOpen(false);
                        if (onDeleteAccount) onDeleteAccount();
                      }}
                      className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
                    >
                      確認刪除
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingDelete(true)}
                  className="w-full p-3 bg-red-50 hover:bg-red-100/80 border border-red-200/80 rounded-2xl flex items-center justify-between text-xs font-bold text-red-600 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>刪除帳戶 (永久抹除資料)</span>
                  </div>
                </button>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                關閉設定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Birth Date Change Application Modal */}
      <BirthDateChangeModal
        isOpen={isBirthChangeModalOpen}
        currentBirthDate={user.birthDate}
        onClose={() => setIsBirthChangeModalOpen(false)}
        onSubmitChange={onRequestBirthDateChange}
      />

      {/* Time Limit Settings Modal */}
      {isTimeLimitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-100 shadow-xl relative animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">健康使用時限設定</h3>
                  <p className="text-[10px] text-slate-400">管控每日與單次使用時間</p>
                </div>
              </div>
              <button
                onClick={() => setIsTimeLimitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lock Notice if <= 10 mins remaining */}
            {isTimeLimitLocked && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-amber-900 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1 text-amber-800">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>最後 10 分鐘保護鎖定中</span>
                </p>
                <p className="text-[11px] text-amber-800/90 leading-relaxed">
                  您的時限剩餘時間不足 10 分鐘，系統已自動進入防護鎖定狀態。在此期間暫時無法修改或關閉時限。
                </p>
              </div>
            )}

            <form onSubmit={handleSaveTimeLimit} className="space-y-4 pt-1">
              {/* Enable / Disable Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div>
                  <span className="block text-xs font-bold text-slate-800">
                    開啟使用時間限制
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    達到上限時提示休息
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isTimeLimitLocked}
                    checked={tlEnabled}
                    onChange={(e) => setTlEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-disabled:opacity-50"></div>
                </label>
              </div>

              {!tlEnabled ? (
                <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3 text-rose-900 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1 text-rose-700">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>關閉時限提醒</span>
                  </p>
                  <p className="text-[11px] text-rose-800/90 leading-relaxed">
                    關閉使用時限後，系統將無法為您提醒使用時間，這可能無法讓您的使用時間受到健康有效的管控。
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
                            disabled={isTimeLimitLocked}
                            onClick={() => {
                              setTlCycle(c);
                              setTlMinutes(Math.round(bounds.total * 0.5));
                            }}
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer disabled:opacity-50 ${
                              tlCycle === c
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
                      const bounds = getTimeLimitBounds(tlCycle);
                      const limitErr = validateTimeLimitMinutes(tlCycle, tlMinutes);
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
                              disabled={isTimeLimitLocked}
                              min={bounds.minMinutes}
                              max={bounds.maxMinutes}
                              value={tlMinutes}
                              onChange={(e) => setTlMinutes(Number(e.target.value))}
                              className={`w-full px-3 py-2 text-xs font-bold bg-white border rounded-xl focus:outline-none focus:ring-2 disabled:opacity-50 ${
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

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTimeLimitModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={
                    isTimeLimitLocked ||
                    (tlEnabled && !!validateTimeLimitMinutes(tlCycle, tlMinutes))
                  }
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  儲存設定
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
