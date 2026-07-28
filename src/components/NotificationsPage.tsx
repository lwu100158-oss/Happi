import React, { useEffect, useState } from "react";
import {
  Bell,
  Sparkles,
  CheckCircle2,
  Heart,
  MessageCircle,
  ShieldCheck,
  ArrowRight,
  CheckCheck,
  Flag,
  AlertOctagon,
  UserCheck,
  UserX,
  Mail,
  Send,
} from "lucide-react";
import { Notification, User } from "../types";

interface NotificationsPageProps {
  notifications: Notification[];
  currentUser: User;
  onMarkAllRead: () => void;
  onSelectPost: (postId: string) => void;
  onRequestManualReview?: (notifId: string, userReason: string) => void;
  onAdminResolveReview?: (notifId: string, action: "approve" | "reject") => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications,
  currentUser,
  onMarkAllRead,
  onSelectPost,
  onRequestManualReview,
  onAdminResolveReview,
}) => {
  const [reviewingNotifId, setReviewingNotifId] = useState<string | null>(null);
  const [appealReason, setAppealReason] = useState("");

  // Auto-mark notifications as read when viewing notifications page
  useEffect(() => {
    if (notifications.some((n) => !n.read)) {
      onMarkAllRead();
    }
  }, [notifications, onMarkAllRead]);

  const handleSendManualReview = (notifId: string) => {
    if (!onRequestManualReview) return;
    onRequestManualReview(notifId, appealReason.trim() || "請求官方 Happi 團隊人工覆核");
    setReviewingNotifId(null);
    setAppealReason("");
  };

  const isAdmin =
    currentUser.username === "admin" ||
    currentUser.username === "Happi_offical" ||
    currentUser.name === "Happi_offical" ||
    currentUser.id === "admin";

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">通知中心</h2>
            {isAdmin && (
              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                👑 Happi 官方管理團隊
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onMarkAllRead}
          className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-bold px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>全部已讀</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-2.5">
        {notifications.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl text-center border border-slate-100 text-slate-400 space-y-2">
            <Bell className="w-8 h-8 mx-auto stroke-1 text-slate-300" />
            <p className="text-xs">目前沒有任何通知訊息</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all relative ${
                !n.read
                  ? "bg-emerald-50/60 border-emerald-200 shadow-xs"
                  : "bg-white border-slate-100 hover:border-slate-200"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon based on notification type */}
                <div className="mt-0.5 shrink-0">
                  {n.type === "moderation_complete" && (
                    <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <Sparkles className="w-4 h-4 fill-white/20" />
                    </div>
                  )}
                  {n.type === "appeal_complete" && (
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  )}
                  {n.type === "report_result" && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Flag className="w-4 h-4" />
                    </div>
                  )}
                  {n.type === "penalty_notice" && (
                    <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                      <AlertOctagon className="w-4 h-4" />
                    </div>
                  )}
                  {n.type === "manual_review_request" && (
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                      <Mail className="w-4 h-4" />
                    </div>
                  )}
                  {n.type === "like" && (
                    <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                      <Heart className="w-4 h-4 fill-white" />
                    </div>
                  )}
                  {n.type === "comment" && (
                    <div className="w-8 h-8 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-xs">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                  )}
                  {n.type === "system" && (
                    <div className="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">{n.title}</h4>
                    <span className="text-[10px] text-slate-400">
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>

                  {n.ageRating && (
                    <div className="inline-block mt-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      分級判定：{n.ageRating} ({n.stage || "AI 審查"})
                    </div>
                  )}

                  {/* Manual Review Appeal Action for Penalty Notices */}
                  {n.type === "penalty_notice" && (
                    <div className="pt-2">
                      {n.appealStatus === "pending" ? (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-semibold flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-amber-600" />
                          已申請人工審查（案件已提交至 Happi 官方團隊）
                        </div>
                      ) : n.appealStatus === "approved" ? (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          官方人工複審結果：申訴通過，處罰已解除！
                        </div>
                      ) : n.appealStatus === "rejected" ? (
                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-900 font-semibold">
                          官方人工複審結果：維護 AI 原判（維持處分）。
                        </div>
                      ) : (
                        <div>
                          {reviewingNotifId === n.id ? (
                            <div className="space-y-2 p-3 bg-amber-50/80 border border-amber-200 rounded-2xl mt-1">
                              <label className="block text-[11px] font-bold text-amber-900">
                                向 Happi 官方管理團隊說明申訴事由：
                              </label>
                              <textarea
                                value={appealReason}
                                onChange={(e) => setAppealReason(e.target.value)}
                                placeholder="請說明認為處分不合理的具體原因..."
                                className="w-full p-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-800 focus:outline-none resize-none h-16"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => setReviewingNotifId(null)}
                                  className="px-2.5 py-1 text-slate-600 font-semibold text-xs hover:bg-slate-200/50 rounded-lg cursor-pointer"
                                >
                                  取消
                                </button>
                                <button
                                  onClick={() => handleSendManualReview(n.id)}
                                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Send className="w-3 h-3" />
                                  送出人工審查申請
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReviewingNotifId(n.id)}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Mail className="w-3.5 h-3.5 text-amber-600" />
                              <span>請求 Happi 官方團隊人工審查</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Admin Resolution Panel for Manual Review Requests */}
                  {n.type === "manual_review_request" && isAdmin && (
                    <div className="mt-2.5 p-3 bg-slate-900 text-white rounded-2xl space-y-2">
                      <div className="text-[11px] font-bold text-amber-400 flex items-center justify-between">
                        <span>👑 管理員專屬審核 (Happi_offical)</span>
                        <span className="text-[10px] text-slate-400">
                          {n.appealStatus === "approved"
                            ? "已審定：撤銷處分"
                            : n.appealStatus === "rejected"
                            ? "已審定：維持原判"
                            : "待審核案"}
                        </span>
                      </div>
                      {n.appealReason && (
                        <p className="text-xs bg-white/10 p-2 rounded-xl italic text-slate-200">
                          用戶申訴理由："{n.appealReason}"
                        </p>
                      )}

                      {n.appealStatus === "pending" || !n.appealStatus ? (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => onAdminResolveReview?.(n.id, "approve")}
                            className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            核准 (撤銷封鎖/禁言)
                          </button>
                          <button
                            onClick={() => onAdminResolveReview?.(n.id, "reject")}
                            className="flex-1 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            駁回 (維持原處分)
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-emerald-400 font-bold pt-1">
                          此審查案件已結案。
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {n.postId && (
                  <button
                    onClick={() => onSelectPost(n.postId!)}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 shrink-0 cursor-pointer"
                    title="前往貼文"
                  >
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

