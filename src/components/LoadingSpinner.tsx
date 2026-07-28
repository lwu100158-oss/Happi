import React from "react";
import { Sparkles, RefreshCw, Heart } from "lucide-react";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  fullScreen = false,
  message = "Happi 社群資料讀取與同步中...",
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center space-y-3.5 animate-fadeIn">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing circle */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-100/80 animate-ping absolute inset-0 opacity-40" />
        
        {/* Middle rotating ring */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-400 via-teal-400 to-emerald-500 p-0.5 shadow-lg shadow-emerald-200/50 animate-spin">
          <div className="w-full h-full bg-white rounded-[22px]" />
        </div>

        {/* Center Heart/Sparkle Icon */}
        <div className="absolute inset-0 flex items-center justify-center text-emerald-600">
          <Heart className="w-7 h-7 fill-emerald-500 animate-pulse text-emerald-500" />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-700 tracking-wide flex items-center justify-center gap-1.5">
          <span>{message}</span>
          <Sparkles className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
        </p>
        <p className="text-[10px] text-slate-400 font-medium">請稍候，Happi 正為您載入最新內容...</p>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};
