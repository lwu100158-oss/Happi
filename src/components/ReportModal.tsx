import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, X, Send, Sparkles, UserX, Flag } from "lucide-react";
import { User, Post } from "../types";

interface ReportModalProps {
  targetUser: { id: string; name: string; avatar: string; handle?: string; blockHistory?: any[] };
  targetPost?: Post;
  currentUser: User;
  onClose: () => void;
  onSubmitReport: (reportData: {
    targetUserId: string;
    targetUserName: string;
    reportedContent?: string;
    category: string;
    detailReason: string;
    blockHistory?: any[];
  }) => Promise<void>;
}

const REPORT_CATEGORIES = [
  "騷擾或人身攻擊",
  "仇恨言論或歧視",
  "不當/色情內容",
  "詐騙、不實或垃圾訊息",
  "暴力或危險行為",
  "其他違規行為",
];

export const ReportModal: React.FC<ReportModalProps> = ({
  targetUser,
  targetPost,
  currentUser,
  onClose,
  onSubmitReport,
}) => {
  const [category, setCategory] = useState(REPORT_CATEGORIES[0]);
  const [detailReason, setDetailReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmitReport({
        targetUserId: targetUser.id,
        targetUserName: targetUser.name,
        reportedContent: targetPost ? targetPost.content : undefined,
        category,
        detailReason,
        blockHistory: targetUser.blockHistory || [],
      });
      onClose();
    } catch (err) {
      console.error("Report submit error:", err);
      alert("檢舉送出失敗，請重試");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">檢舉內容與使用者</h3>
              <p className="text-[11px] text-slate-400">PolliNation AI 即時審查與安全處置</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Target Profile Summary */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
            <img
              src={targetUser.avatar}
              alt={targetUser.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-rose-200 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">{targetUser.name}</div>
              <div className="text-[10px] text-slate-500">
                {targetUser.handle ? `@${targetUser.handle}` : `ID: ${targetUser.id}`}
              </div>
            </div>
            {targetUser.blockHistory && targetUser.blockHistory.length > 0 && (
              <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                已有 {targetUser.blockHistory.length} 次違規紀錄
              </span>
            )}
          </div>

          {/* Target Post Preview if reporting specific post */}
          {targetPost && (
            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100 text-xs text-slate-700 space-y-1">
              <div className="font-bold text-amber-900 text-[11px] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                涉嫌違規貼文內容：
              </div>
              <p className="line-clamp-2 text-slate-600 italic">"{targetPost.content}"</p>
            </div>
          )}

          {/* Category selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              請選擇檢舉類別：
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REPORT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`p-2.5 text-xs font-semibold rounded-xl border text-left transition-all cursor-pointer ${
                    category === cat
                      ? "bg-rose-50 border-rose-400 text-rose-800 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Detail explanation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              補充說明 (選填)：
            </label>
            <textarea
              value={detailReason}
              onChange={(e) => setDetailReason(e.target.value)}
              placeholder="請詳細說明具體違規情況，幫助 PolliNation AI 進行更精確的分析..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all resize-none h-20"
            />
          </div>

          {/* Notice Banner */}
          <div className="p-3 bg-slate-900/5 rounded-2xl text-[11px] text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>PolliNation AI 即時裁決機制：</span>
            </div>
            <p className="leading-relaxed">
              送出後，PolliNation AI 將同時比對該使用者【過往違規/封鎖紀錄】。若審查確定違規，系統將自動實施<b>警告、禁言或帳號封鎖</b>，並於兩方的通知中心發送處置結果。
            </p>
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-slate-600 font-bold text-xs hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>PolliNation AI 審查中...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>送出檢舉並啟動 AI 審查</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
