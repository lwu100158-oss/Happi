import React, { useState } from "react";
import { Calendar, ShieldCheck, Heart, Sparkles, Clock } from "lucide-react";

interface BirthDateModalProps {
  currentBirthDate: string | null;
  currentTimeLimitMinutes?: number;
  onSaveBirthDate: (birthDate: string, timeLimitMinutes?: number) => void;
  isOpen: boolean;
  onClose?: () => void;
}

export const BirthDateModal: React.FC<BirthDateModalProps> = ({
  currentBirthDate,
  currentTimeLimitMinutes = 30,
  onSaveBirthDate,
  isOpen,
  onClose,
}) => {
  const [birthDate, setBirthDate] = useState<string>(
    currentBirthDate || "2000-01-01"
  );
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(currentTimeLimitMinutes);
  const [enableTimeLimit, setEnableTimeLimit] = useState<boolean>(true);
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
    if (enableTimeLimit && (isNaN(timeLimitMinutes) || timeLimitMinutes < 5 || timeLimitMinutes > 1440)) {
      setError("時限請輸入 5 至 1440 分鐘之間");
      return;
    }

    onSaveBirthDate(birthDate, enableTimeLimit ? timeLimitMinutes : undefined);
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
            歡迎來到 Happi <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-500" />
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            請完成基礎資料設定，協助系統為您開啟客製化社群體驗
          </p>
        </div>

        {/* Highlighted Notice Prompt */}
        <div className="my-4 p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 text-emerald-900 text-xs flex items-start gap-2.5 leading-relaxed">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-700 block mb-0.5">
              溫馨提示
            </span>
            提醒：<strong className="text-emerald-800">年齡並不會影響任何我們對您提供的服務，請放心輸入！</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              1. 出生日期 (Date of Birth)
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
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all font-medium"
              required
            />
          </div>

          {/* Time Limit Setting on Registration */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-slate-800">
                    2. 每日健康使用時限設定
                  </span>
                  <span className="block text-[10px] text-slate-400">
                    可輸入您希望的每日使用時間 (分鐘)
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={enableTimeLimit}
                  onChange={(e) => setEnableTimeLimit(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {enableTimeLimit && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-600 font-medium">每天限制：</span>
                <input
                  type="number"
                  min={5}
                  max={1440}
                  value={timeLimitMinutes}
                  onChange={(e) => {
                    setTimeLimitMinutes(parseInt(e.target.value) || 0);
                    setError("");
                  }}
                  className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                  placeholder="30"
                  required={enableTimeLimit}
                />
                <span className="text-xs text-slate-600 font-bold">分鐘</span>
              </div>
            )}
          </div>

          {error && <p className="text-xs font-bold text-rose-500 text-center">{error}</p>}

          <div className="pt-2 flex items-center gap-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors"
              >
                稍後再說
              </button>
            )}
            <button
              type="submit"
              className={`py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                onClose ? "w-2/3" : "w-full"
              }`}
            >
              <Heart className="w-4 h-4 fill-white/30" />
              確認設定並進入 Happi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
