import React, { useState, useEffect } from "react";
import { User, Post, Comment, Notification, ActiveTab, TimeLimitConfig } from "./types";
import {
  INITIAL_USER,
  INITIAL_POSTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_COMMENTS,
  extractHashtags,
} from "./data";
import {
  subscribePosts,
  savePostToFirestore,
  deletePostFromFirestore,
  subscribeComments,
  saveCommentToFirestore,
  deleteCommentFromFirestore,
  subscribeNotifications,
  saveNotificationToFirestore,
  markAllNotificationsReadInFirestore,
  saveUserToFirestore,
  subscribeUser,
  fetchUserFromFirestore,
} from "./services/firestoreService";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { PostCard } from "./components/PostCard";
import { CreatePostPage } from "./components/CreatePostPage";
import { BirthDateModal } from "./components/BirthDateModal";
import { AppealModal } from "./components/AppealModal";
import { NotificationsPage } from "./components/NotificationsPage";
import { ProfilePage } from "./components/ProfilePage";
import { HashtagsExplorePage } from "./components/HashtagsExplorePage";
import { ReportModal } from "./components/ReportModal";
import { OtherUserProfileModal } from "./components/OtherUserProfileModal";
import { LandingPage } from "./components/LandingPage";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { checkIsAdmin } from "./utils";
import { Sparkles, Hash, LogIn, Clock, AlertTriangle, Lock, ShieldCheck, X, Droplets, BookOpen, Coffee, Heart } from "lucide-react";

export default function App() {
  // Local storage state initialization
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const saved = localStorage.getItem("happi_is_logged_in");
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem("happi_user");
    return saved ? JSON.parse(saved) : INITIAL_USER;
  });

  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem("happi_posts");
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem("happi_comments");
    return saved ? JSON.parse(saved) : INITIAL_COMMENTS;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem("happi_notifications");
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [isPostsLoading, setIsPostsLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [isCreatePostPageOpen, setIsCreatePostPageOpen] = useState(false);
  const [selectedHashtagFilter, setSelectedHashtagFilter] = useState<string | null>(null);
  const [isBirthDateModalOpen, setIsBirthDateModalOpen] = useState(false);
  const [appealModalPost, setAppealModalPost] = useState<Post | null>(null);

  // Blocked users & Report Modal states
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("happi_blocked_user_ids");
    return saved ? JSON.parse(saved) : [];
  });

  const [reportModalTarget, setReportModalTarget] = useState<{
    user: { id: string; name: string; avatar: string; handle?: string; blockHistory?: any[] };
    post?: Post;
  } | null>(null);

  useEffect(() => {
    localStorage.setItem("happi_blocked_user_ids", JSON.stringify(blockedUserIds));
  }, [blockedUserIds]);

  // Time limit tracking states
  const [hasNotified10Min, setHasNotified10Min] = useState(false);
  const [hasNotifiedExhausted, setHasNotifiedExhausted] = useState(false);
  const [showExhaustedModal, setShowExhaustedModal] = useState(false);

  // Real-time active usage timer & cycle auto-reset monitor
  useEffect(() => {
    if (!user?.timeLimit?.enabled || !isLoggedIn) return;

    // Fast timer (every 3 seconds) for responsive cycle auto-reset detection
    const cycleResetCheckInterval = setInterval(() => {
      setUser((prevUser) => {
        if (!prevUser.timeLimit?.enabled) return prevUser;

        const cycle = prevUser.timeLimit.cycle || "1h";
        const cycleDurationMs =
          cycle === "1h"
            ? 60 * 60 * 1000
            : cycle === "3h"
            ? 3 * 60 * 60 * 1000
            : 24 * 60 * 60 * 1000;

        const now = Date.now();
        const startTime = prevUser.timeLimit.cycleStartTime
          ? new Date(prevUser.timeLimit.cycleStartTime).getTime()
          : now;

        // Check if cycle expired -> Automatically reset usage!
        if (now - startTime >= cycleDurationMs) {
          setHasNotified10Min(false);
          setHasNotifiedExhausted(false);
          setShowExhaustedModal(false);
          return {
            ...prevUser,
            timeLimit: {
              ...prevUser.timeLimit,
              usedMinutes: 0,
              cycleStartTime: new Date(now).toISOString(),
            },
          };
        }

        return prevUser;
      });
    }, 3000);

    // Active usage minute counter (every 60 seconds)
    const usageTimer = setInterval(() => {
      setUser((prevUser) => {
        if (!prevUser.timeLimit?.enabled) return prevUser;

        const limit = prevUser.timeLimit.limitMinutes || 30;
        const currentUsed = prevUser.timeLimit.usedMinutes || 0;

        if (currentUsed < limit) {
          return {
            ...prevUser,
            timeLimit: {
              ...prevUser.timeLimit,
              usedMinutes: currentUsed + 1,
            },
          };
        }

        return prevUser;
      });
    }, 60000);

    return () => {
      clearInterval(cycleResetCheckInterval);
      clearInterval(usageTimer);
    };
  }, [isLoggedIn, user?.timeLimit?.enabled]);

  // Time limit monitor effect
  useEffect(() => {
    if (!user?.timeLimit?.enabled || !isLoggedIn) return;

    const limit = user.timeLimit.limitMinutes || 30;
    const used = user.timeLimit.usedMinutes || 0;
    const remaining = limit - used;

    // Trigger Rule 1: <= 10 mins remaining
    if (remaining <= 10 && remaining > 0 && !hasNotified10Min) {
      setHasNotified10Min(true);
      const newNotif: Notification = {
        id: "n_tl_warn_" + Date.now(),
        userId: user.id,
        type: "system",
        title: "⚠️ 健康使用時限提醒",
        message: `您的使用時間僅剩 ${Math.max(1, remaining)} 分鐘，快達到設定的限制了！進入最後 10 分鐘將自動鎖定時限修改功能。`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }

    // Trigger Rule 2: <= 0 mins remaining (Exhausted)
    if (remaining <= 0 && !hasNotifiedExhausted) {
      setHasNotifiedExhausted(true);
      setShowExhaustedModal(true);
      const newNotif: Notification = {
        id: "n_tl_ex_" + Date.now(),
        userId: user.id,
        type: "system",
        title: "⏰ 使用時間已達上限",
        message: `您的本週期健康使用時間（${limit} 分鐘）已經達到上限！請適度休息、保護眼睛靈魂之窗。`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  }, [user.timeLimit, isLoggedIn, hasNotified10Min, hasNotifiedExhausted]);

  const handleUpdateTimeLimit = (newConfig: TimeLimitConfig) => {
    setUser((prev) => {
      const updated = {
        ...prev,
        timeLimit: newConfig,
      };
      saveUserToFirestore(updated);
      return updated;
    });
    setHasNotified10Min(false);
    setHasNotifiedExhausted(false);

    const newNotif: Notification = {
      id: "n_tl_upd_" + Date.now(),
      userId: user.id,
      type: "system",
      title: "健康使用時限已更新",
      message: newConfig.enabled
        ? `使用時限已更新：週期【${newConfig.cycle === "1h" ? "1小時" : newConfig.cycle === "3h" ? "3小時" : "1天"}】，限制額度為 ${newConfig.limitMinutes} 分鐘。`
        : "已關閉健康使用時限設定。",
      createdAt: new Date().toISOString(),
      read: false,
    };
    saveNotificationToFirestore(newNotif);
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Helper functions for testing/simulating time usage
  const handleSimulateUsedMinutes = (minutesToAdd: number) => {
    if (!user.timeLimit) return;
    const limit = user.timeLimit.limitMinutes || 30;
    const currentUsed = user.timeLimit.usedMinutes || 0;
    const newUsed = Math.min(limit, currentUsed + minutesToAdd);

    setUser((prev) => ({
      ...prev,
      timeLimit: {
        ...prev.timeLimit!,
        usedMinutes: newUsed,
      },
    }));
  };

  const handleSimulateJumpTo10MinsRemaining = () => {
    if (!user.timeLimit) return;
    const limit = user.timeLimit.limitMinutes || 30;
    const targetUsed = Math.max(0, limit - 9); // Exactly 9 mins remaining (<= 10 mins)

    setUser((prev) => ({
      ...prev,
      timeLimit: {
        ...prev.timeLimit!,
        usedMinutes: targetUsed,
      },
    }));
  };

  const handleSimulateJumpToExhausted = () => {
    if (!user.timeLimit) return;
    const limit = user.timeLimit.limitMinutes || 30;

    setUser((prev) => ({
      ...prev,
      timeLimit: {
        ...prev.timeLimit!,
        usedMinutes: limit,
      },
    }));
  };

  const handleResetTimeLimitUsage = () => {
    if (!user.timeLimit) return;
    setUser((prev) => ({
      ...prev,
      timeLimit: {
        ...prev.timeLimit!,
        usedMinutes: 0,
      },
    }));
    setHasNotified10Min(false);
    setHasNotifiedExhausted(false);
    setShowExhaustedModal(false);
  };

  // Sync to local storage & Cloud Firestore
  useEffect(() => {
    localStorage.setItem("happi_is_logged_in", JSON.stringify(isLoggedIn));
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem("happi_user", JSON.stringify(user));
    if (isLoggedIn && user?.id) {
      saveUserToFirestore(user);
    }
  }, [user, isLoggedIn]);

  useEffect(() => {
    localStorage.setItem("happi_posts", JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem("happi_comments", JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    localStorage.setItem("happi_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Real-time Cloud Firestore Subscriptions
  useEffect(() => {
    const unsubPosts = subscribePosts((cloudPosts) => {
      if (cloudPosts && cloudPosts.length > 0) {
        setPosts((prevPosts) => {
          const cloudMap = new Map(cloudPosts.map((p) => [p.id, p]));
          const now = Date.now();
          // Preserve local pending posts created within last 15 minutes that haven't synced yet
          const pendingLocalPosts = prevPosts.filter((localP) => {
            if (cloudMap.has(localP.id)) return false;
            const createdTime = new Date(localP.createdAt).getTime();
            return !isNaN(createdTime) && now - createdTime < 15 * 60 * 1000;
          });
          return [...pendingLocalPosts, ...cloudPosts].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      } else {
        INITIAL_POSTS.forEach((p) => savePostToFirestore(p));
      }
      setIsPostsLoading(false);
    });

    const unsubComments = subscribeComments((cloudComments) => {
      if (cloudComments && cloudComments.length > 0) {
        setComments(cloudComments);
      } else {
        INITIAL_COMMENTS.forEach((c) => saveCommentToFirestore(c));
      }
    });

    return () => {
      unsubPosts();
      unsubComments();
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !user.id) return;

    const unsubNotifs = subscribeNotifications(user.id, (cloudNotifs) => {
      if (cloudNotifs && cloudNotifs.length > 0) {
        setNotifications(cloudNotifs);
      } else {
        INITIAL_NOTIFICATIONS.forEach((n) =>
          saveNotificationToFirestore({ ...n, userId: user.id })
        );
      }
    });

    return () => {
      unsubNotifs();
    };
  }, [isLoggedIn, user.id]);

  // Loading state for async actions & data synchronization
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionLoadingText, setActionLoadingText] = useState("Happi 雲端資料處理中...");

  // Handle Birth Date & Time Limit Registration prompt
  const handleSaveBirthDate = (birthDate: string, timeLimitMinutes?: number) => {
    setIsActionLoading(true);
    setActionLoadingText("正在儲存個人健康年齡與時限設定...");

    setUser((prev) => {
      const newTimeLimit = timeLimitMinutes
        ? {
            enabled: true,
            limitMinutes: timeLimitMinutes,
            cycle: prev.timeLimit?.cycle || "1d",
            usedMinutesToday: prev.timeLimit?.usedMinutesToday || 0,
            lastResetTimestamp: prev.timeLimit?.lastResetTimestamp || new Date().toISOString(),
          }
        : prev.timeLimit;

      const updatedUser = {
        ...prev,
        birthDate,
        hasCompletedBirthDatePrompt: true,
        timeLimit: newTimeLimit,
      };

      saveUserToFirestore(updatedUser);
      localStorage.setItem("happi_user", JSON.stringify(updatedUser));
      return updatedUser;
    });

    setTimeout(() => {
      setIsActionLoading(false);
      setIsBirthDateModalOpen(false);
    }, 500);
  };

  const handleUpdateBio = (newBio: string) => {
    setUser((prev) => ({
      ...prev,
      bio: newBio,
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("happi_user");
    localStorage.removeItem("happi_posts");
    localStorage.removeItem("happi_comments");
    localStorage.removeItem("happi_notifications");
    setUser({ ...INITIAL_USER, hasCompletedBirthDatePrompt: true });
    setPosts(INITIAL_POSTS);
    setComments(INITIAL_COMMENTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setActiveTab("home");
    setIsLoggedIn(false);
    setIsBirthDateModalOpen(false);
  };

  const handleDeleteAccount = () => {
    try {
      const savedUsers = localStorage.getItem("happi_registered_users");
      if (savedUsers) {
        const usersList = JSON.parse(savedUsers);
        const filtered = usersList.filter(
          (u: any) => u.id !== user.id && u.username !== user.username
        );
        localStorage.setItem("happi_registered_users", JSON.stringify(filtered));
      }
    } catch (e) {
      console.error(e);
    }
    handleLogout();
  };

  // Like Toggle
  const handleToggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const newLiked = !p.likedByMe;
          const updatedPost = {
            ...p,
            likedByMe: newLiked,
            likes: newLiked ? p.likes + 1 : p.likes - 1,
          };
          savePostToFirestore(updatedPost);
          return updatedPost;
        }
        return p;
      })
    );
  };

  // Save / Bookmark Toggle
  const handleToggleSave = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const updatedPost = {
            ...p,
            savedByMe: !p.savedByMe,
          };
          savePostToFirestore(updatedPost);
          return updatedPost;
        }
        return p;
      })
    );
  };

  // Block / Unblock User
  const handleToggleBlockUser = (targetUserId: string) => {
    setBlockedUserIds((prev) => {
      const isBlocked = prev.includes(targetUserId);
      if (isBlocked) {
        return prev.filter((id) => id !== targetUserId);
      } else {
        return [...prev, targetUserId];
      }
    });
  };

  // Submit Report & AI Moderation Review
  const handleSubmitReport = async (reportData: {
    targetUserId: string;
    targetUserName: string;
    reportedContent?: string;
    category: string;
    detailReason: string;
    blockHistory?: any[];
  }) => {
    try {
      const res = await fetch("/api/report/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterName: user.name,
          targetUserId: reportData.targetUserId,
          targetUserName: reportData.targetUserName,
          reportedContent: reportData.reportedContent,
          category: reportData.category,
          detailReason: reportData.detailReason,
          blockHistory: reportData.blockHistory || [],
        }),
      });

      const resData = await res.json();
      const isViolation = resData.isViolation;
      const penaltyType = resData.penaltyType || "none";
      const penaltyDays = resData.penaltyDays || 0;
      const reason = resData.reason || "PolliNation AI 審查完成";

      // 1. Send report result notification to reporter
      const reporterNotif: Notification = {
        id: "n_rep_" + Date.now(),
        userId: user.id,
        type: "report_result",
        title: isViolation ? "PolliNation AI 審查完成：檢舉成立" : "PolliNation AI 審查完成：檢舉未成立",
        message: `您對「${reportData.targetUserName}」的檢舉審查完畢。結論：${reason}${
          isViolation ? ` (懲處：${penaltyType === "ban" ? "封鎖" : penaltyType === "mute" ? "禁言" : "警告"})` : ""
        }`,
        createdAt: new Date().toISOString(),
        read: false,
        targetUserId: reportData.targetUserId,
        targetUserName: reportData.targetUserName,
      };

      saveNotificationToFirestore(reporterNotif);
      setNotifications((prev) => [reporterNotif, ...prev]);

      // 2. If violation confirmed, send penalty notice to target user
      if (isViolation && penaltyType !== "none") {
        const targetNotif: Notification = {
          id: "n_pen_" + Date.now(),
          userId: reportData.targetUserId,
          type: "penalty_notice",
          title: `PolliNation AI 安全處置通知：${penaltyType === "ban" ? "帳號封鎖" : penaltyType === "mute" ? "發言禁言" : "違規警告"}`,
          message: `系統收到對您言行的檢舉，經過往紀錄綜合審查確定違規。原因：${reason}。${
            penaltyType !== "warning" ? `處分天數：${penaltyDays} 天。如有疑義，可於下方發起 Happi 官方人工審查。` : ""
          }`,
          createdAt: new Date().toISOString(),
          read: false,
          penaltyType,
          penaltyDurationDays: penaltyDays,
          appealStatus: "none",
        };

        saveNotificationToFirestore(targetNotif);
        setNotifications((prev) => [targetNotif, ...prev]);

        // If current user was the reported target
        if (reportData.targetUserId === user.id) {
          setUser((prev) => {
            const newHistory = [
              ...(prev.blockHistory || []),
              {
                date: new Date().toISOString(),
                reason,
                action: `${penaltyType} (${penaltyDays}天)`,
              },
            ];
            const updated = {
              ...prev,
              isMuted: penaltyType === "mute" || penaltyType === "ban",
              isBanned: penaltyType === "ban",
              blockHistory: newHistory,
            };
            saveUserToFirestore(updated);
            return updated;
          });
        }
      }
    } catch (err) {
      console.error("Submit report error:", err);
      alert("檢舉審查服務異常，請再試一次");
    }
  };

  // User submits manual review request to official admin team
  const handleRequestManualReview = (notifId: string, userReason: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, appealStatus: "pending", appealReason: userReason } : n))
    );

    const adminNotif: Notification = {
      id: "n_man_" + Date.now(),
      userId: "u_admin_happi",
      type: "manual_review_request",
      title: `🚨 收到用戶人工審查申訴 (${user.name})`,
      message: `使用者「${user.name}」對 AI 安全處分提出了人工覆核請求。`,
      createdAt: new Date().toISOString(),
      read: false,
      reporterId: user.id,
      reporterName: user.name,
      appealReason: userReason,
      appealStatus: "pending",
    };

    saveNotificationToFirestore(adminNotif);
    setNotifications((prev) => [adminNotif, ...prev]);
  };

  // Admin resolves manual review
  const handleAdminResolveReview = (notifId: string, action: "approve" | "reject") => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, appealStatus: action === "approve" ? "approved" : "rejected" } : n))
    );

    if (action === "approve") {
      setUser((prev) => {
        const updated = {
          ...prev,
          isMuted: false,
          isBanned: false,
        };
        saveUserToFirestore(updated);
        return updated;
      });

      const resNotif: Notification = {
        id: "n_res_" + Date.now(),
        userId: user.id,
        type: "system",
        title: "👑 Happi 官方人工審查結果：申訴通過",
        message: "Happi 官方團隊已完成人工覆核，現已撤銷違規處分，全面恢復您的發言權限！",
        createdAt: new Date().toISOString(),
        read: false,
      };
      saveNotificationToFirestore(resNotif);
      setNotifications((prev) => [resNotif, ...prev]);
    } else {
      const resNotif: Notification = {
        id: "n_res_" + Date.now(),
        userId: user.id,
        type: "system",
        title: "👑 Happi 官方人工審查結果：維護原判",
        message: "Happi 官方團隊複審後維持原 AI 處置決定。",
        createdAt: new Date().toISOString(),
        read: false,
      };
      saveNotificationToFirestore(resNotif);
      setNotifications((prev) => [resNotif, ...prev]);
    }
  };

  // Add Comment
  const handleAddComment = (postId: string, content: string) => {
    if (user.isBanned) {
      alert("您的帳戶目前處於【封鎖保護狀態】，拒絕處理發言請求。可在通知中心提出人工審查。");
      return;
    }
    if (user.isMuted) {
      alert("您的帳戶目前處於【禁言保護狀態】，無法發表留言。可在通知中心提出人工審查。");
      return;
    }

    const newComment: Comment = {
      id: "c_" + Date.now(),
      postId,
      authorName: user.name,
      authorAvatar: user.avatar,
      authorHandle: "",
      content,
      createdAt: new Date().toISOString(),
    };

    saveCommentToFirestore(newComment);

    setComments((prev) => [newComment, ...prev]);
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const updatedPost = { ...p, commentsCount: p.commentsCount + 1 };
          savePostToFirestore(updatedPost);
          return updatedPost;
        }
        return p;
      })
    );
  };

  // Submit New Post via CreatePostPage
  const handleCreatePost = async (data: {
    content: string;
    imageUrl?: string;
    isPrivate: boolean;
    hashtags: string[];
  }) => {
    if (user.isBanned) {
      alert("您的帳戶目前處於【封鎖保護狀態】，AI 已拒絕您的發布請求。可在通知中心提出人工審查。");
      return;
    }
    if (user.isMuted) {
      alert("您的帳戶目前處於【禁言保護狀態】，無法發布貼文。可在通知中心提出人工審查。");
      return;
    }
    let moderationResult: {
      status: "pending" | "approved" | "restricted" | "blocked";
      ageRating: string;
      reason: string;
      stage: string;
    } = {
      status: "approved",
      ageRating: "不限 (私人)",
      reason: "私人貼文免除 AI 審查",
      stage: "AI 安全審查",
    };

    if (!data.isPrivate) {
      try {
        const response = await fetch("/api/moderate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: data.content,
            isPrivate: data.isPrivate,
          }),
        });
        const resData = await response.json();
        if (resData) {
          moderationResult = {
            status: resData.allowed ? "approved" : "restricted",
            ageRating: resData.ageRating || "所有年齡 (0-99歲)",
            reason: resData.reason || "完成內容分類與年齡把關",
            stage: resData.stage || "AI 安全審查 (完成)",
          };
        }
      } catch (err) {
        console.warn("AI Moderation endpoint error, fallback to default rating:", err);
      }
    }

    const newPost: Post = {
      id: "p_" + Date.now(),
      authorId: user.id,
      authorName: user.name || "Happi 會員",
      authorAvatar: user.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      authorHandle: user.username ? `@${user.username}` : "@happi_member",
      content: data.content,
      hashtags: data.hashtags.length > 0 ? data.hashtags : extractHashtags(data.content),
      imageUrl: data.imageUrl || "",
      isPrivate: !!data.isPrivate,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedByMe: false,
      savedByMe: false,
      commentsCount: 0,
      moderation: {
        status: moderationResult.status,
        ageRating: moderationResult.ageRating,
        reason: moderationResult.reason,
        stage: moderationResult.stage,
        hasAppealed: false,
        appealStage: "none",
      },
    };

    await savePostToFirestore(newPost);
    setPosts((prev) => [newPost, ...prev.filter((p) => p.id !== newPost.id)]);

    // Send AI Moderation Notification if public
    if (!data.isPrivate) {
      const newNotif: Notification = {
        id: "n_" + Date.now(),
        userId: user.id,
        type: "moderation_complete",
        title: "Happi AI 安全天眼審查通知",
        message: `您的新貼文審查完成，分級為：【${moderationResult.ageRating}】 (${moderationResult.reason})`,
        createdAt: new Date().toISOString(),
        read: false,
        postId: newPost.id,
        ageRating: moderationResult.ageRating,
        stage: moderationResult.stage,
      };
      await saveNotificationToFirestore(newNotif);
      setNotifications((prev) => [newNotif, ...prev]);
    }

    setIsCreatePostPageOpen(false);
    setActiveTab("home");
  };

  const handleDeletePost = async (postId: string) => {
    setIsActionLoading(true);
    setActionLoadingText("正在從 Happi 社群雲端資料庫永久刪除貼文...");
    try {
      await deletePostFromFirestore(postId);
      const updated = posts.filter((p) => p.id !== postId);
      setPosts(updated);
      localStorage.setItem("happi_posts", JSON.stringify(updated));
    } catch (err) {
      console.error("Delete post error:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditPost = async (postId: string, newContent: string, newImageUrl?: string) => {
    const hashtags = extractHashtags(newContent);
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return;

    const updatedPost: Post = {
      ...targetPost,
      content: newContent,
      imageUrl: newImageUrl !== undefined ? newImageUrl : targetPost.imageUrl,
      hashtags,
    };

    await savePostToFirestore(updatedPost);
    setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
  };

  // Submit Post Appeal (Stage 2: AI 深度二審 / Stage 3: Happi 官方團隊人工三審)
  const handleSubmitAppeal = async (postId: string, userReason: string, isThirdStage?: boolean) => {
    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return;

    if (isThirdStage) {
      // Stage 3: Submit to Happi Official Admin Team for Manual Review
      const updatedPost: Post = {
        ...targetPost,
        moderation: {
          ...targetPost.moderation,
          stage: "Happi 官方團隊 (三審人工審查中)",
          appealStage: "third_requested",
          thirdStageReason: userReason,
        },
      };

      await savePostToFirestore(updatedPost);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));

      // Notify admin team
      const adminNotif: Notification = {
        id: "n_3rd_" + Date.now(),
        userId: "u_admin_happi",
        type: "manual_review_request",
        title: `🚨 貼文三審人工審查申請 (${user.name})`,
        message: `使用者「${user.name}」對貼文提出的 Happi 官方團隊三審人工審查申請。申訴說明：${userReason || "無"}`,
        createdAt: new Date().toISOString(),
        read: false,
        postId: postId,
        reporterId: user.id,
        reporterName: user.name,
        appealReason: userReason,
        appealStatus: "pending",
      };
      await saveNotificationToFirestore(adminNotif);
      setNotifications((prev) => [adminNotif, ...prev]);

      // Notify user confirmation
      const userNotif: Notification = {
        id: "n_3rd_usr_" + Date.now(),
        userId: user.id,
        type: "system",
        title: "Happi 官方團隊三審受理通知",
        message: `您的貼文三審申請已成功送達 Happi 官方團隊！管理人員將於 24 小時內完成人工親自覆核。`,
        createdAt: new Date().toISOString(),
        read: false,
        postId: postId,
      };
      await saveNotificationToFirestore(userNotif);
      setNotifications((prev) => [userNotif, ...prev]);

      return;
    }

    // Stage 2: AI Precision Review
    try {
      const res = await fetch("/api/gemini/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: targetPost.content,
          previousRating: targetPost.moderation.ageRating,
          userReason,
        }),
      });

      const resData = await res.json();

      const updatedAgeRating = resData.ageRating || "所有年齡 (0-99歲)";
      const updatedReason = resData.reason || "Happi AI 深度二審完成";

      const updatedPost: Post = {
        ...targetPost,
        moderation: {
          status: resData.allowed ? "approved" : "restricted",
          ageRating: updatedAgeRating,
          reason: updatedReason,
          stage: "Happi AI 安全天眼 (二審)",
          hasAppealed: true,
          appealStage: "second_completed",
          userAppealReason: userReason,
          secondStageReason: updatedReason,
        },
      };

      await savePostToFirestore(updatedPost);

      // Update Post state
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? updatedPost : p))
      );

      // Create Notification
      const newNotif: Notification = {
        id: "n_appeal_" + Date.now(),
        userId: user.id,
        type: "appeal_complete",
        title: "Happi AI 二審 (深度申訴) 結果通知",
        message: `您的貼文二審複審完成，最新分級為：【${updatedAgeRating}】 (${updatedReason})。如有異議，可進一步申請 Happi 官方團隊三審人工審查。`,
        createdAt: new Date().toISOString(),
        read: false,
        postId,
        ageRating: updatedAgeRating,
        stage: "Happi AI 安全天眼 (二審)",
      };

      await saveNotificationToFirestore(newNotif);
      setNotifications((prev) => [newNotif, ...prev]);
    } catch (err) {
      console.error("Happi AI Appeal Failed:", err);
      throw err;
    }
  };

  // Handle Groq Birthdate Modification Request
  const handleRequestBirthDateChange = async (
    newBirthDate: string,
    reason: string
  ) => {
    // 免審查直接生效判斷：若原本未設定生日或帶有首次免審查標記
    if (!user.birthDate || reason === "首次免審查設定") {
      setUser((prev) => {
        const updated = {
          ...prev,
          birthDate: newBirthDate,
        };
        saveUserToFirestore(updated);
        return updated;
      });

      const newNotif: Notification = {
        id: "n_birth_first_" + Date.now(),
        userId: user.id,
        type: "system",
        title: "生日年齡設定成功 (免審查)",
        message: `您已成功補設定生日為 ${newBirthDate}！系統已自動套用適齡防護防護機制。`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      saveNotificationToFirestore(newNotif);
      setNotifications((prev) => [newNotif, ...prev]);
      return { approved: true, reason: "首次設定免待審查，直接更新生效" };
    }

    try {
      const res = await fetch("/api/groq/modify-birthdate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentBirthDate: user.birthDate,
          newBirthDate,
          reason,
          registeredAt: user.registeredAt,
        }),
      });

      const resData = await res.json();

      if (resData.approved) {
        setUser((prev) => {
          const updated = {
            ...prev,
            birthDate: newBirthDate,
          };
          saveUserToFirestore(updated);
          return updated;
        });

        const newNotif: Notification = {
          id: "n_birth_" + Date.now(),
          userId: user.id,
          type: "system",
          title: "AI 審核通過：生日變更成功",
          message: `您申請將生日修改為 ${newBirthDate} 已通過審核！結論：${resData.reason}。(${resData.accountAgeText || ""})`,
          createdAt: new Date().toISOString(),
          read: false,
        };
        saveNotificationToFirestore(newNotif);
        setNotifications((prev) => [newNotif, ...prev]);
        return resData;
      } else {
        const newNotif: Notification = {
          id: "n_birth_fail_" + Date.now(),
          userId: user.id,
          type: "system",
          title: "AI 審核退回：生日變更申請未通過",
          message: `您申請將生日修改為 ${newBirthDate} 未通過審核。原因：${resData.reason}。(${resData.accountAgeText || ""})`,
          createdAt: new Date().toISOString(),
          read: false,
        };
        saveNotificationToFirestore(newNotif);
        setNotifications((prev) => [newNotif, ...prev]);
        return resData;
      }
    } catch (err) {
      console.error("Birthdate change request error:", err);
      throw err;
    }
  };

  const handleMarkAllNotificationsRead = () => {
    markAllNotificationsReadInFirestore(notifications);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const currentUserIsAdmin = checkIsAdmin(user);

  // Viewing other user's profile state
  const [viewingProfileUserId, setViewingProfileUserId] = useState<string | null>(null);

  const handleViewProfile = (targetUserId: string) => {
    if (!targetUserId || targetUserId === user.id) {
      setViewingProfileUserId(null);
      setActiveTab("profile");
    } else {
      setViewingProfileUserId(targetUserId);
    }
  };

  const handleUpdateProfile = async (updated: { name: string; username: string; avatar: string; bio: string }) => {
    const updatedUser: User = {
      ...user,
      name: updated.name,
      username: updated.username,
      avatar: updated.avatar,
      bio: updated.bio,
    };

    setUser(updatedUser);
    localStorage.setItem("happi_user", JSON.stringify(updatedUser));
    await saveUserToFirestore(updatedUser);

    // Sync user's posts author info
    const updatedPosts = posts.map((p) => {
      if (p.authorId === user.id) {
        const newPost = {
          ...p,
          authorName: updated.name,
          authorHandle: `@${updated.username}`,
          authorAvatar: updated.avatar,
        };
        savePostToFirestore(newPost);
        return newPost;
      }
      return p;
    });
    setPosts(updatedPosts);
    localStorage.setItem("happi_posts", JSON.stringify(updatedPosts));

    // Sync user's comments author info
    const updatedComments = comments.map((c) => {
      if (c.authorHandle === `@${user.username}` || c.authorName === user.name) {
        const newComment = {
          ...c,
          authorName: updated.name,
          authorHandle: `@${updated.username}`,
          authorAvatar: updated.avatar,
        };
        saveCommentToFirestore(newComment);
        return newComment;
      }
      return c;
    });
    setComments(updatedComments);
    localStorage.setItem("happi_comments", JSON.stringify(updatedComments));
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteCommentFromFirestore(commentId);
      const updated = comments.filter((c) => c.id !== commentId);
      setComments(updated);
      localStorage.setItem("happi_comments", JSON.stringify(updated));
    } catch (err) {
      console.error("Delete comment error:", err);
    }
  };

  // Filter posts based on active hashtag or current view
  const userPosts = posts.filter((p) => p.authorId === user.id);
  const savedPosts = posts.filter((p) => p.savedByMe);

  const displayedFeedPosts = posts.filter((p) => {
    // Hide private posts created by other users (Even admins cannot view other users' private posts)
    if (p.isPrivate && p.authorId !== user.id) {
      return false;
    }
    if (selectedHashtagFilter) {
      return p.hashtags.includes(selectedHashtagFilter);
    }
    return true;
  });

  const handleLogin = async (userProfile?: Partial<User>) => {
    if (userProfile) {
      const userId = userProfile.id || `u_${Date.now()}`;
      const existingUser = await fetchUserFromFirestore(userId);
      const newUser: User = existingUser || {
        id: userId,
        username: userProfile.username || "happi_user",
        name: userProfile.name || "Happi 會員",
        avatar: userProfile.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        birthDate: userProfile.birthDate || "",
        bio: userProfile.bio || "分享生活的點滴 🌿",
        registeredAt: userProfile.registeredAt || new Date().toISOString(),
        hasCompletedBirthDatePrompt: true,
        isGuest: userProfile.isGuest,
      };
      await saveUserToFirestore(newUser);
      setUser(newUser);
    }
    setIsLoggedIn(true);
    setIsBirthDateModalOpen(false);
  };

  // If user is logged out, render Landing Page
  if (!isLoggedIn) {
    return <LandingPage onLogin={handleLogin} />;
  }

  // If Create Post Page is active, display full screen page view
  if (isCreatePostPageOpen) {
    return (
      <CreatePostPage
        onBack={() => setIsCreatePostPageOpen(false)}
        onSubmitPost={handleCreatePost}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-20">
      {/* Top Bar Header */}
      <Header
        isGuest={user.isGuest}
        onLoginClick={handleLogout}
        onOpenCreatePost={() => setIsCreatePostPageOpen(true)}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setActiveTab("notifications")}
        selectedHashtag={selectedHashtagFilter}
        onClearHashtagFilter={() => setSelectedHashtagFilter(null)}
      />

      {/* Main Container View */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-4 space-y-4">
        {/* Tab 1: Home Feed */}
        {activeTab === "home" && (
          <div className="space-y-4">
            {/* Top Banner / Hashtag Filter Banner */}
            {selectedHashtagFilter ? (
              <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                <span className="font-bold flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-emerald-600" />
                  正在查看包含 #{selectedHashtagFilter} 的貼文討論
                </span>
                <button
                  onClick={() => setSelectedHashtagFilter(null)}
                  className="font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  查看全部
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-4 text-white shadow-md shadow-emerald-200/50 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-sm flex items-center gap-1">
                    happi 樂活角落
                    <Sparkles className="w-4 h-4 text-emerald-200 fill-emerald-200" />
                  </h2>
                  <p className="text-xs text-emerald-100 mt-0.5">
                    清新優雅的社交空間，安心交流生活趣事。
                  </p>
                </div>
                <button
                  onClick={() => setIsCreatePostPageOpen(true)}
                  className="bg-white text-emerald-700 hover:bg-emerald-50 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                >
                  + 發布貼文
                </button>
              </div>
            )}

            {/* Posts Feed List */}
            {isPostsLoading ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs flex items-center justify-center">
                <LoadingSpinner message="Happi 社群貼文同步中..." />
              </div>
            ) : displayedFeedPosts.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl text-center border border-slate-100 text-slate-500 space-y-3 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">目前還沒有動態貼文</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  成為社群第一個分享生活的 Happi 會員吧！點擊上方按鈕發布第一則貼文。
                </p>
                <button
                  onClick={() => setIsCreatePostPageOpen(true)}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  + 發布第一則貼文
                </button>
              </div>
            ) : (
              displayedFeedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  comments={comments.filter((c) => c.postId === post.id)}
                  userBirthDate={user.birthDate}
                  currentUserId={user.id}
                  currentUserIsAdmin={currentUserIsAdmin}
                  blockedUserIds={blockedUserIds}
                  onLike={handleToggleLike}
                  onSave={handleToggleSave}
                  onAddComment={handleAddComment}
                  onHashtagClick={(tag) => setSelectedHashtagFilter(tag)}
                  onOpenAppeal={(p) => setAppealModalPost(p)}
                  onViewProfile={handleViewProfile}
                  onToggleBlock={handleToggleBlockUser}
                  onOpenReport={(targetUser, targetPost) =>
                    setReportModalTarget({ user: targetUser, post: targetPost })
                  }
                  onEditPost={handleEditPost}
                  onDeletePost={handleDeletePost}
                  onDeleteComment={handleDeleteComment}
                />
              ))
            )}
          </div>
        )}

        {/* Tab 2: Hashtags Explore */}
        {activeTab === "explore" && (
          <HashtagsExplorePage
            posts={posts}
            comments={comments}
            userBirthDate={user.birthDate}
            currentUserId={user.id}
            currentUserIsAdmin={currentUserIsAdmin}
            blockedUserIds={blockedUserIds}
            selectedHashtag={selectedHashtagFilter}
            onSelectHashtag={(tag) => setSelectedHashtagFilter(tag)}
            onClearHashtag={() => setSelectedHashtagFilter(null)}
            onLike={handleToggleLike}
            onSave={handleToggleSave}
            onAddComment={handleAddComment}
            onOpenAppeal={(p) => setAppealModalPost(p)}
            onViewProfile={handleViewProfile}
            onToggleBlock={handleToggleBlockUser}
            onOpenReport={(targetUser, targetPost) =>
              setReportModalTarget({ user: targetUser, post: targetPost })
            }
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
            onDeleteComment={handleDeleteComment}
          />
        )}

        {/* Tab 3: Notifications */}
        {activeTab === "notifications" && (
          user.isGuest ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xs text-center space-y-4 my-6">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <LogIn className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-800">登入以使用這項服務</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  「通知」為 Happi 會員專屬功能，登入帳號後即可接收專屬動態、審核狀態與互動通知。
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                前往登入 / 註冊帳號
              </button>
            </div>
          ) : (
            <NotificationsPage
              notifications={notifications}
              currentUser={user}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onSelectPost={(postId) => {
                setActiveTab("home");
              }}
              onRequestManualReview={handleRequestManualReview}
              onAdminResolveReview={handleAdminResolveReview}
            />
          )
        )}

        {/* Tab 4: Saved Records */}
        {activeTab === "saved" && (
          user.isGuest ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xs text-center space-y-4 my-6">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <LogIn className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-800">登入以使用這項服務</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  「已儲存紀錄」為 Happi 會員專屬功能，登入帳號後即可隨心收藏您喜愛的內容與討論。
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                前往登入 / 註冊帳號
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-3xl border border-slate-100 text-slate-800 text-sm font-bold shadow-xs">
                🔖 已儲存的紀錄與收藏貼文
              </div>
              {savedPosts.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl text-center border border-slate-100 text-slate-400">
                  <p className="text-xs">目前沒有儲存任何貼文</p>
                </div>
              ) : (
                savedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    comments={comments.filter((c) => c.postId === post.id)}
                    userBirthDate={user.birthDate}
                    currentUserId={user.id}
                    currentUserIsAdmin={currentUserIsAdmin}
                    blockedUserIds={blockedUserIds}
                    onLike={handleToggleLike}
                    onSave={handleToggleSave}
                    onAddComment={handleAddComment}
                    onHashtagClick={(tag) => {
                      setSelectedHashtagFilter(tag);
                      setActiveTab("home");
                    }}
                    onOpenAppeal={(p) => setAppealModalPost(p)}
                    onViewProfile={handleViewProfile}
                    onToggleBlock={handleToggleBlockUser}
                    onOpenReport={(targetUser, targetPost) =>
                      setReportModalTarget({ user: targetUser, post: targetPost })
                    }
                    onEditPost={handleEditPost}
                    onDeletePost={handleDeletePost}
                  />
                ))
              )}
            </div>
          )
        )}

        {/* Tab 5: Profile */}
        {activeTab === "profile" && (
          user.isGuest ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xs text-center space-y-4 my-6">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <LogIn className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-slate-800">登入以使用這項服務</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  「個人檔案」為 Happi 會員專屬功能，登入帳號後即可管理個人暱稱、頭像與社群發文紀錄。
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
              >
                前往登入 / 註冊帳號
              </button>
            </div>
          ) : (
            <ProfilePage
              user={user}
              userPosts={userPosts}
              savedPosts={savedPosts}
              comments={comments}
              onOpenBirthDatePrompt={() => setIsBirthDateModalOpen(true)}
              onRequestBirthDateChange={handleRequestBirthDateChange}
              onLike={handleToggleLike}
              onSave={handleToggleSave}
              onAddComment={handleAddComment}
              onHashtagClick={(tag) => {
                setSelectedHashtagFilter(tag);
                setActiveTab("home");
              }}
              onOpenAppeal={(p) => setAppealModalPost(p)}
              onUpdateBio={handleUpdateBio}
              onUpdateProfile={handleUpdateProfile}
              onLogout={handleLogout}
              onDeleteAccount={handleDeleteAccount}
              onUpdateTimeLimit={handleUpdateTimeLimit}
              onEditPost={handleEditPost}
              onDeletePost={handleDeletePost}
              onDeleteComment={handleDeleteComment}
            />
          )
        )}
      </main>

      {/* Time Limit Indicator (Only displayed on Profile Page) */}
      {user.timeLimit?.enabled && activeTab === "profile" && (
        <div className="max-w-xl w-full mx-auto px-4 mb-4">
          {(() => {
            const limit = user.timeLimit.limitMinutes || 30;
            const used = user.timeLimit.usedMinutes || 0;
            const remaining = Math.max(0, limit - used);
            const isLocked = remaining <= 10;
            const isExhausted = remaining <= 0;

            return (
              <div
                className={`p-3.5 rounded-2xl border transition-all text-xs flex flex-col space-y-2 ${
                  isExhausted
                    ? "bg-rose-50 border-rose-200 text-rose-900"
                    : isLocked
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-indigo-50/80 border-indigo-200/80 text-indigo-900"
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      健康時限進度 ({user.timeLimit.cycle === "1h" ? "1小時" : user.timeLimit.cycle === "3h" ? "3小時" : "1天"}週期)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isLocked && <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                    <span>
                      已用 {used} / {limit} 分鐘 (剩餘 {remaining}m)
                    </span>
                  </div>
                </div>

                {isLocked && !isExhausted && (
                  <p className="text-[11px] font-medium text-amber-800 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>距離額度僅剩不足 10 分鐘，系統已自動進入修改鎖定保護模式。</span>
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Bottom Sticky Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Birth Date Prompt Modal */}
      <BirthDateModal
        isOpen={isBirthDateModalOpen}
        currentBirthDate={user.birthDate}
        onSaveBirthDate={handleSaveBirthDate}
        onClose={
          user.hasCompletedBirthDatePrompt
            ? () => setIsBirthDateModalOpen(false)
            : undefined
        }
      />

      {/* Gemini API Appeal Modal */}
      {appealModalPost && (
        <AppealModal
          post={appealModalPost}
          isOpen={!!appealModalPost}
          onClose={() => setAppealModalPost(null)}
          onSubmitAppeal={handleSubmitAppeal}
        />
      )}

      {/* Time Limit Exhausted Fullscreen Overlay Card */}
      {showExhaustedModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 border border-slate-100 shadow-2xl relative text-center animate-scaleUp">
            
            {/* Header Icon */}
            <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-200">
              <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center text-indigo-600">
                <Clock className="w-10 h-10 animate-pulse text-indigo-600" />
              </div>
            </div>

            {/* Header Titles */}
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                <Lock className="w-3.5 h-3.5" />
                <span>健康使用時間限制保護中</span>
              </span>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                鐘聲響起 ⏰ 時間到了！
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                您在本週期的使用額度（<b>{user.timeLimit?.limitMinutes || 30} 分鐘</b>）已全數達到上限。為了您的身心健康，系統已暫時鎖定畫面。
              </p>
            </div>

            {/* Core Reminders Grid */}
            <div className="space-y-2.5 text-left">
              <p className="text-xs font-bold text-slate-700 px-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>給您的休息小建議：</span>
              </p>

              <div className="grid grid-cols-1 gap-2.5">
                {/* 1. 多喝水 */}
                <div className="p-3.5 bg-sky-50/80 border border-sky-100 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-sky-950">💧 多喝水</h4>
                    <p className="text-[11px] text-sky-800/80 leading-tight mt-0.5">
                      補充水分，順便站起來伸展筋骨、活動一下全身吧！
                    </p>
                  </div>
                </div>

                {/* 2. 放下手機吧 */}
                <div className="p-3.5 bg-rose-50/80 border border-rose-100 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-rose-950">📱 放下手機吧</h4>
                    <p className="text-[11px] text-rose-800/80 leading-tight mt-0.5">
                      暫時離開螢幕，讓雙眼遠眺綠色植物或窗外景色。
                    </p>
                  </div>
                </div>

                {/* 3. 多讀點書 */}
                <div className="p-3.5 bg-amber-50/80 border border-amber-100 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-950">📚 多讀點書</h4>
                    <p className="text-[11px] text-amber-800/80 leading-tight mt-0.5">
                      翻翻喜愛的實體書籍，沉澱心靈，享受純粹的閱讀時光。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lock Notice Footnote */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[11px] text-slate-400 font-medium">
                本畫面將持續鎖定，直到下個更新週期開始。
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Report & AI Review Modal */}
      {reportModalTarget && (
        <ReportModal
          targetUser={reportModalTarget.user}
          targetPost={reportModalTarget.post}
          currentUser={user}
          onClose={() => setReportModalTarget(null)}
          onSubmitReport={handleSubmitReport}
        />
      )}

      {/* View Other User's Profile Modal */}
      {viewingProfileUserId && (
        <OtherUserProfileModal
          targetUserId={viewingProfileUserId}
          currentUserId={user.id}
          currentUserIsAdmin={currentUserIsAdmin}
          userBirthDate={user.birthDate}
          posts={posts}
          comments={comments}
          blockedUserIds={blockedUserIds}
          onClose={() => setViewingProfileUserId(null)}
          onLike={handleToggleLike}
          onSave={handleToggleSave}
          onAddComment={handleAddComment}
          onHashtagClick={(tag) => {
            setSelectedHashtagFilter(tag);
            setViewingProfileUserId(null);
            setActiveTab("home");
          }}
          onOpenAppeal={(p) => setAppealModalPost(p)}
          onToggleBlock={handleToggleBlockUser}
          onOpenReport={(targetUser, targetPost) =>
            setReportModalTarget({ user: targetUser, post: targetPost })
          }
          onEditPost={handleEditPost}
          onDeletePost={handleDeletePost}
          onDeleteComment={handleDeleteComment}
        />
      )}

      {/* Global Action Loading Overlay */}
      {isActionLoading && (
        <LoadingSpinner fullScreen message={actionLoadingText} />
      )}
    </div>
  );
}
