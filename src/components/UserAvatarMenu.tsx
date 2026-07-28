import React, { useState, useRef, useEffect } from "react";
import { UserCheck, UserX, Flag, ExternalLink, MoreVertical } from "lucide-react";

interface UserAvatarMenuProps {
  user: {
    id: string;
    name: string;
    avatar: string;
    handle?: string;
    blockHistory?: any[];
  };
  currentUserId: string;
  isBlocked?: boolean;
  onViewProfile: (userId: string) => void;
  onToggleBlock: (userId: string) => void;
  onOpenReport: (user: any) => void;
}

export const UserAvatarMenu: React.FC<UserAvatarMenuProps> = ({
  user,
  currentUserId,
  isBlocked,
  onViewProfile,
  onToggleBlock,
  onOpenReport,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close popup menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const isSelf = user.id === currentUserId;

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Clickable Avatar Container */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="relative group focus:outline-none cursor-pointer block"
        title="點擊開啟選單：個人檔案、封鎖、檢舉"
      >
        <img
          src={user.avatar}
          alt={user.name}
          className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-emerald-100 group-hover:ring-emerald-400 transition-all shadow-xs"
        />
        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs border border-slate-100 opacity-80 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="w-2.5 h-2.5 text-slate-600" />
        </div>
      </button>

      {/* Popover Action Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <div className="text-xs font-bold text-slate-800 truncate">{user.name}</div>
            {user.handle && <div className="text-[10px] text-slate-400 truncate">@{user.handle}</div>}
          </div>

          {/* View Profile */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onViewProfile(user.id);
            }}
            className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>檢視個人檔案</span>
          </button>

          {!isSelf && (
            <>
              {/* Block / Unblock */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onToggleBlock(user.id);
                }}
                className={`w-full px-3.5 py-2 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                  isBlocked
                    ? "text-emerald-600 hover:bg-emerald-50"
                    : "text-amber-700 hover:bg-amber-50"
                }`}
              >
                {isBlocked ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>解除封鎖</span>
                  </>
                ) : (
                  <>
                    <UserX className="w-3.5 h-3.5 text-amber-600" />
                    <span>封鎖此使用者</span>
                  </>
                )}
              </button>

              {/* Report */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  onOpenReport(user);
                }}
                className="w-full px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Flag className="w-3.5 h-3.5 text-rose-500" />
                <span>檢舉與 AI 審查</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
