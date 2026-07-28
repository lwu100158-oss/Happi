import React, { useState } from "react";
import { Calendar, ShieldCheck, Heart, Sparkles } from "lucide-react";

interface BirthDateModalProps {
  currentBirthDate: string | null;
  onSaveBirthDate: (birthDate: string) => void;
  isOpen: boolean;
  onClose?: () => void;
}

export const BirthDateModal: React.FC<BirthDateModalProps> = ({
  currentBirthDate,
  onSaveBirthDate,
  isOpen,
  onClose,
}) => {
  const [birthDate, setBirthDate] = useState<string>(
    currentBirthDate || "2000-01-01"
  );
  const [error, setError] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthDate) {
      setError("請選擇您的出生日期");
      return;
    }
    const selectedYear = new Date(birthDate).getFullYear();
    const currentYear = new Date().getFullYear();
    if (selectedYear > currentYear || selectedYear < 1900) {
      setError("請輸入有效的出生日期");
      return;
    }
    onSaveBirthDate(birthDate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 overflow-hidden relative">
        {/* Decorative Top Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />

        <div className="text-center mt-2">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 mb-3 shadow-inner">
            <Calendar className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-1.5">
            歡迎來到 happi <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-500" />
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            請輸入您的出生日期，協助系統為您開啟客製化社群體驗
          </p>
        </div>

        {/* Highlighted Notice Prompt */}
        <div className="my-5 p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 text-emerald-900 text-xs flex items-start gap-2.5 leading-relaxed">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-700 block mb-0.5">
              溫馨提示
            </span>
            提醒：<strong className="text-emerald-800">年齡並不會影響任何我們對你提供的服務，請放心輸入！</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              出生日期 (Date of Birth)
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => {
                setBirthDate(e.target.value);
                setError("");
              }}
              max={new Date().toISOString().split("T")[0]}
              min="1920-01-01"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all"
              required
            />
            {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
          </div>

          <div className="pt-2 flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                稍後再說
              </button>
            )}
            <button
              type="submit"
              className={`py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                onClose ? "w-2/3" : "w-full"
              }`}
            >
              <Heart className="w-4 h-4 fill-white/30" />
              確認儲存並開始使用
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
