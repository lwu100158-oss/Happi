import React, { useState } from "react";
import { Sparkles, AlertCircle, Send, ShieldCheck, X } from "lucide-react";
import { Post } from "../types";

interface AppealModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onSubmitAppeal: (postId: string, userReason: string) => Promise<void>;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await onSubmitAppeal(post.id, userReason.trim());
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
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 fill-purple-200" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                AI 深度申訴複審
              </h3>
              <p className="text-[11px] text-slate-400">更精確的二次 AI 語意與情境審查</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Rating Details */}
        <div className="my-4 p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-xs space-y-1">
          <div className="flex items-center justify-between text-amber-900 font-bold">
            <span>初審結果 ({post.moderation.stage || "AI 初審"})</span>
            <span className="bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-md">
              {post.moderation.ageRating}
            </span>
          </div>
          <p className="text-slate-600 text-[11px]">{post.moderation.reason}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              申訴說明 (給 AI 的補充說明, 選填)
            </label>
            <textarea
              value={userReason}
              onChange={(e) => setUserReason(e.target.value)}
              placeholder="例如：內文僅為藝術文學隱喻，並非倡導危險行為，希望重設為全年齡可看..."
              className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
            />
          </div>

          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-[11px] text-purple-900 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <span>
              AI 將使用最先進的語意理解技術重新評估貼文脈絡，確保您的創作自由與社群規範平衡。
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
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-200 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{isSubmitting ? "AI 複審中..." : "送出 AI 深度複審"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
