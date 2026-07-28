import React, { useEffect, useState } from "react";
import { User, Post, Comment } from "../types";
import { fetchUserFromFirestore } from "../services/firestoreService";
import { checkIsAdmin } from "../utils";
import { PostCard } from "./PostCard";
import { LoadingSpinner } from "./LoadingSpinner";
import {
  X,
  Sparkles,
  ShieldCheck,
  UserCheck,
  UserX,
  Flag,
  Calendar,
  Lock,
  Crown,
} from "lucide-react";

interface OtherUserProfileModalProps {
  targetUserId: string;
  currentUserId: string;
  currentUserIsAdmin?: boolean;
  userBirthDate?: string | null;
  posts: Post[];
  comments: Comment[];
  blockedUserIds?: string[];
  onClose: () => void;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onHashtagClick: (hashtag: string) => void;
  onOpenAppeal: (post: Post) => void;
  onToggleBlock: (userId: string) => void;
  onOpenReport: (user: any, post?: Post) => void;
  onEditPost?: (postId: string, newContent: string, newImageUrl?: string) => void;
  onDeletePost?: (postId: string) => void;
}

export const OtherUserProfileModal: React.FC<OtherUserProfileModalProps> = ({
  targetUserId,
  currentUserId,
  currentUserIsAdmin = false,
  userBirthDate,
  posts,
  comments,
  blockedUserIds = [],
  onClose,
  onLike,
  onSave,
  onAddComment,
  onHashtagClick,
  onOpenAppeal,
  onToggleBlock,
  onOpenReport,
  onEditPost,
  onDeletePost,
}) => {
  const [profileUser, setProfileUser] = useState<Partial<User> | null>(null);
  const [loading, setLoading] = useState(true);

  const isBlocked = blockedUserIds.includes(targetUserId);

  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      setLoading(true);
      // 1. Try finding author info from posts list
      const authorPost = posts.find((p) => p.authorId === targetUserId);
      let initialUser: Partial<User> | null = authorPost
        ? {
            id: authorPost.authorId,
            name: authorPost.authorName,
            avatar: authorPost.authorAvatar,
            username: authorPost.authorHandle ? authorPost.authorHandle.replace("@", "") : "happi_member",
            bio: " Happi 社群成員 🌿",
          }
        : null;

      // 2. Fetch full user object from Firestore
      const dbUser = await fetchUserFromFirestore(targetUserId);
      if (isMounted) {
        if (dbUser) {
          setProfileUser(dbUser);
        } else if (initialUser) {
          setProfileUser(initialUser);
        } else {
          setProfileUser({
            id: targetUserId,
            name: "Happi 會員",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
            username: "user",
            bio: "這個使用者尚未填寫簡介",
          });
        }
        setLoading(false);
      }
    }

    loadUser();
    return () => {
      isMounted = false;
    };
  }, [targetUserId, posts]);

  // Filter public posts created by this user ONLY (hide private posts of other users, even for admins)
  const targetUserPublicPosts = posts.filter((p) => {
    if (p.authorId !== targetUserId) return false;
    // Private posts are ONLY visible to the author. Even admins cannot view other users' private posts.
    if (p.isPrivate) return false;
    return true;
  });

  const isTargetAdmin = checkIsAdmin(profileUser);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full my-auto shadow-2xl border border-slate-100 overflow-hidden relative animate-scaleUp max-h-[90vh] flex flex-col">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">個人主頁</span>
            {isTargetAdmin && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />
                官方管理員
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            title="關閉主頁"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* User Banner & Avatar Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs relative overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 -m-5 mb-0 relative" />

            <div className="relative pt-2 flex items-start justify-between">
              <div className="flex items-center gap-3.5 min-w-0">
                <img
                  src={
                    profileUser?.avatar ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                  }
                  alt={profileUser?.name || "用戶大頭貼"}
                  className="w-16 h-16 rounded-2xl object-cover shrink-0 ring-4 ring-white shadow-md -mt-8"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5 truncate">
                    <span>{profileUser?.name || "Happi 會員"}</span>
                    {isTargetAdmin ? (
                      <Crown className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-500 shrink-0" />
                    )}
                  </h3>
                  {profileUser?.username && (
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">
                      @{profileUser.username}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons: Block / Report */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onToggleBlock(targetUserId)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isBlocked
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  title={isBlocked ? "解除封鎖" : "封鎖此使用者"}
                >
                  {isBlocked ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>已封鎖</span>
                    </>
                  ) : (
                    <>
                      <UserX className="w-3.5 h-3.5 text-slate-500" />
                      <span>封鎖</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() =>
                    onOpenReport({
                      id: targetUserId,
                      name: profileUser?.name || "Happi 會員",
                      avatar: profileUser?.avatar,
                      handle: profileUser?.username ? `@${profileUser.username}` : "",
                    })
                  }
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer border border-rose-100"
                  title="檢舉使用者"
                >
                  <Flag className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bio */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <p className="leading-relaxed">
                {profileUser?.bio || "這個使用者很神秘，尚未寫下任何簡介 🌿"}
              </p>
            </div>

            {/* Registration Date if present */}
            {profileUser?.registeredAt && (
              <div className="mt-3 pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  註冊時間：
                  {new Date(profileUser.registeredAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* User Posts Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-bold text-slate-700">
                {profileUser?.name || "用戶"} 發布的公開貼文 ({targetUserPublicPosts.length})
              </h4>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                私人貼文已隱藏
              </span>
            </div>

            {loading ? (
              <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-center">
                <LoadingSpinner message="載入個人主頁中..." />
              </div>
            ) : targetUserPublicPosts.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center space-y-1">
                <p className="text-xs font-medium text-slate-500">
                  該使用者目前沒有任何公開貼文
                </p>
              </div>
            ) : (
              targetUserPublicPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  comments={comments.filter((c) => c.postId === post.id)}
                  userBirthDate={userBirthDate}
                  currentUserId={currentUserId}
                  currentUserIsAdmin={currentUserIsAdmin}
                  blockedUserIds={blockedUserIds}
                  onLike={onLike}
                  onSave={onSave}
                  onAddComment={onAddComment}
                  onHashtagClick={onHashtagClick}
                  onOpenAppeal={onOpenAppeal}
                  onToggleBlock={onToggleBlock}
                  onOpenReport={onOpenReport}
                  onEditPost={onEditPost}
                  onDeletePost={onDeletePost}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
