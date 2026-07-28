import React, { useState } from "react";
import { Calendar, AlertCircle, Sparkles, X, Send } from "lucide-react";

interface BirthDateChangeModalProps {
  isOpen: boolean;
  currentBirthDate: string | null;
  onClose: () => void;
  onSubmitChange: (
    newBirthDate: string,
    reason: string
  ) => Promise<{ approved: boolean; reason: string; accountAgeText?: string }>;
}

export const BirthDateChangeModal: React.FC<BirthDateChangeModalProps> = ({
  isOpen,
  currentBirthDate,
  onClose,
  onSubmitChange,
}) => {
  const [newBirthDate, setNewBirthDate] = useState(
    currentBirthDate || "2000-01-01"
  );
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const isFirstTimeSetup = !currentBirthDate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBirthDate) {
      setErrorMsg("請選擇生日日期");
      return;
    }
    if (!isFirstTimeSetup && !reason.trim()) {
      setErrorMsg("請填寫合理的變更理由");
      return;
    }

    setErrorMsg("");
    setIsSubmitting(true);

    try {
      if (isFirstTimeSetup) {
        // 直接生效不用審查
        await onSubmitChange(newBirthDate, "首次免審查設定");
      } else {
        await onSubmitChange(newBirthDate, reason.trim());
      }
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg("設定過程發生錯誤，請稍後重試");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 border border-slate-100 shadow-xl relative animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                {isFirstTimeSetup ? "補設定生日年齡" : "申請變更生日"}
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
              </h3>
              <p className="text-[10px] text-slate-400">
                {isFirstTimeSetup ? "未設定年齡前往設定：無需待審查" : "經 AI 智慧審核"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice Banner */}
        {isFirstTimeSetup ? (
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-[11px] text-emerald-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>首次設定說明：</span>
            </div>
            <p className="leading-relaxed">
              您先前未設定生日年齡。現在進行補充設定<b>無需經過人工或 AI 審查</b>，設定後將立即為您進行適齡防護！
            </p>
          </div>
        ) : (
          <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>AI 審核說明：</span>
            </div>
            <p className="leading-relaxed">
              生日變更需提出合理說明。AI 將審查您提供的理由與<b>【帳戶建立時間】</b>。若帳戶已建立許久卻主張選錯，審核將不予通過。
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* Current Birthdate */}
          <div className="text-xs text-slate-500 flex justify-between px-1">
            <span>目前生日：</span>
            <span className="font-bold text-slate-700">
              {currentBirthDate || "未設定"}
            </span>
          </div>

          {/* New Birthdate Picker */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              希望變更的新生日：
            </label>
            <input
              type="date"
              value={newBirthDate}
              onChange={(e) => setNewBirthDate(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Reason Input (Only if not first time setup) */}
          {!isFirstTimeSetup && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                請輸入合理的變更理由：
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="例如：附上證件更正證明、筆誤勘誤理由..."
                rows={3}
                disabled={isSubmitting}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              />
            </div>
          )}

          {errorMsg && (
            <p className="text-[11px] font-bold text-rose-500 px-1">{errorMsg}</p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <span>AI 審核中...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>提交申請</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
