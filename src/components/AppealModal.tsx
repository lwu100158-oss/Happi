import React, { useState } from "react";
import { Sparkles, Send, ShieldCheck, UserCheck, X, CheckCircle2 } from "lucide-react";
import { Post } from "../types";

interface AppealModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onSubmitAppeal: (postId: string, userReason: string, isThirdStage?: boolean) => Promise<void>;
}

export const AppealModal: React.FC<AppealModalProps> = ({
  post,
  isOpen,
  onClose,
  onSubmitAppeal,
}) => {
  const [userReason, setUserReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Check if post already completed second stage (AI appeal)
  const isSecondStageCompleted =
    post.moderation.hasAppealed ||
    post.moderation.appealStage === "second_completed" ||
    (post.moderation.stage && post.moderation.stage.includes("二審"));

  const isThirdStageRequested =
    post.moderation.appealStage === "third_requested" ||
    post.moderation.appealStage === "third_completed" ||
    (post.moderation.stage && post.moderation.stage.includes("三審"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await onSubmitAppeal(post.id, userReason.trim(), isSecondStageCompleted);
      onClose();
    } catch (err) {
      console.error(err);
      setError("申訴提交失敗，請檢查網路後重試");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl ${isSecondStageCompleted ? "bg-amber-100 text-amber-600" : "bg-purple-100 text-purple-600"} flex items-center justify-center font-bold`}>
              {isSecondStageCompleted ? (
                <UserCheck className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4 fill-purple-200" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isThirdStageRequested
                  ? "三審處置中 (Happi 官方團隊)"
                  : isSecondStageCompleted
                  ? "申請三審 (Happi 官方團隊人工審查)"
                  : "申請二審 (Happi AI 深度複審)"}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isSecondStageCompleted
                  ? "二審完畢後可直通 Happi 官方管理團隊人工覆核"
                  : "二審為 Happi AI 深度情境與脈絡分析"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Rating Details */}
        <div className="my-4 p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs space-y-1">
          <div className="flex items-center justify-between text-amber-900 font-bold">
            <span>當前階段：{post.moderation.stage || "Happi AI 安全天眼"}</span>
            <span className="bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-md">
              {post.moderation.ageRating}
            </span>
          </div>
          <p className="text-slate-600 text-[11px]">{post.moderation.reason}</p>
        </div>

        {isThirdStageRequested ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-900 text-xs leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>已提交三審（Happi 官方團隊人工審查）</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                您的案件已順利送達 Happi 官方團隊，管理人員將於 24 小時內親自人工檢視與裁決，裁決結果將傳送至您的通知中心。
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all cursor-pointer"
              >
                我知道了
              </button>
            </div>
          </div>
        ) : (
          /* Form for Second or Third Stage */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                {isSecondStageCompleted
                  ? "向 Happi 官方團隊說明人工覆核理由 (必填)"
                  : "二審說明 (給 AI 的補充脈絡說明, 選填)"}
              </label>
              <textarea
                value={userReason}
                onChange={(e) => setUserReason(e.target.value)}
                placeholder={
                  isSecondStageCompleted
                    ? "請說明希望 Happi 官方管理人員親自改判的詳細原因..."
                    : "例如：內文僅為藝術創作隱喻，並非倡導不當行為..."
                }
                required={isSecondStageCompleted}
                className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              />
            </div>

            <div className={`p-3 rounded-xl border text-[11px] flex items-start gap-2 ${
              isSecondStageCompleted
                ? "bg-amber-50/80 border-amber-200 text-amber-900"
                : "bg-purple-50/60 border-purple-100 text-purple-900"
            }`}>
              {isSecondStageCompleted ? (
                <UserCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              )}
              <span>
                {isSecondStageCompleted
                  ? "提交三審後，Happi 官方審查人員將會在後台手動檢視此貼文，確保完全公平客觀。"
                  : "二審將啟動 Happi AI 安全天眼高階模型重新評估語意，保障您的交流權益。"}
              </span>
            </div>

            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all cursor-pointer ${
                  isSecondStageCompleted
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
                    : "bg-purple-600 hover:bg-purple-700 shadow-purple-200"
                }`}
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>
                  {isSubmitting
                    ? isSecondStageCompleted
                      ? "提交三審中..."
                      : "AI 二審中..."
                    : isSecondStageCompleted
                    ? "申請三審 (Happi 官方人工審查)"
                    : "申請二審 (Happi AI 深度複審)"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
