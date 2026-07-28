import React from "react";
import { Home, Hash, Bell, Bookmark, User as UserIcon } from "lucide-react";
import { ActiveTab } from "../types";

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  unreadNotificationsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  unreadNotificationsCount,
}) => {
  const tabs = [
    { id: "home" as ActiveTab, label: "首頁", icon: Home },
    { id: "explore" as ActiveTab, label: "標籤", icon: Hash },
    {
      id: "notifications" as ActiveTab,
      label: "通知",
      icon: Bell,
      badge: unreadNotificationsCount,
    },
    { id: "saved" as ActiveTab, label: "儲存", icon: Bookmark },
    { id: "profile" as ActiveTab, label: "個人", icon: UserIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-emerald-100 shadow-lg px-2 py-2">
      <div className="max-w-xl mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center w-14 py-1 rounded-2xl transition-all relative cursor-pointer ${
                isActive
                  ? "text-emerald-600 font-bold bg-emerald-50/80"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />
              <span className="text-[10px] mt-0.5">{tab.label}</span>

              {tab.badge && tab.badge > 0 ? (
                <span className="absolute top-1 right-3 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
