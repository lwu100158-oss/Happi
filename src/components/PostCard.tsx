import React, { useState } from "react";
import {
  Heart,
  Bookmark,
  MessageCircle,
  Lock,
  Share2,
  CornerDownRight,
  EyeOff,
  AlertTriangle,
  MoreVertical,
  ThumbsDown,
  Sparkles,
  Flag,
  Edit3,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { Post, Comment } from "../types";
import { isContentAgeRestricted } from "../utils";
import { UserAvatarMenu } from "./UserAvatarMenu";

interface PostCardProps {
  post: Post;
  comments: Comment[];
  userBirthDate?: string | null;
  currentUserId: string;
  currentUserIsAdmin?: boolean;
  blockedUserIds?: string[];
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onHashtagClick: (hashtag: string) => void;
  onOpenAppeal: (post: Post) => void;
  onViewProfile?: (userId: string) => void;
  onToggleBlock?: (userId: string) => void;
  onOpenReport?: (user: any, post?: Post) => void;
  onEditPost?: (postId: string, newContent: string, newImageUrl?: string) => void;
  onDeletePost?: (postId: string) => void;
  onNotInterested?: (postId: string) => void;
  onInterested?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  comments,
  userBirthDate,
  currentUserId,
  currentUserIsAdmin = false,
  blockedUserIds = [],
  onLike,
  onSave,
  onAddComment,
  onHashtagClick,
  onOpenAppeal,
  onViewProfile = (_userId: string) => {},
  onToggleBlock = (_userId: string) => {},
  onOpenReport = (_user: any, _post?: Post) => {},
  onEditPost,
  onDeletePost,
  onNotInterested,
  onInterested,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPostForceRevealed, setIsPostForceRevealed] = useState(false);
  const [revealedCommentIds, setRevealedCommentIds] = useState<Record<string, boolean>>({});

  // Menu & Edit/Delete States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotInterested, setIsNotInterested] = useState(false);
  const [isInterested, setIsInterested] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editImageUrl, setEditImageUrl] = useState(post.imageUrl || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isBlockedAuthor = blockedUserIds.includes(post.authorId);
  const isAuthor = currentUserId === post.authorId;
  const canDelete = isAuthor || currentUserIsAdmin;

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    try {
      await onAddComment(post.id, newCommentText.trim());
      setNewCommentText("");
    } catch (err) {
      console.error("Error sending comment:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Menu action handlers
  const handleNotInterestedAction = () => {
    setIsNotInterested(true);
    setIsMenuOpen(false);
    onNotInterested?.(post.id);
  };

  const handleInterestedAction = () => {
    setIsInterested(true);
    setIsMenuOpen(false);
    setToastMessage("已標示為感興趣！✨");
    setTimeout(() => setToastMessage(null), 2500);
    onInterested?.(post.id);
    if (!post.likedByMe) {
      onLike(post.id);
    }
  };

  const handleReportAction = () => {
    setIsMenuOpen(false);
    onOpenReport(
      {
        id: post.authorId,
        name: post.authorName,
        avatar: post.authorAvatar,
        handle: post.authorHandle,
      },
      post
    );
  };

  const handleOpenEditModal = () => {
    setEditContent(post.content);
    setEditImageUrl(post.imageUrl || "");
    setIsEditing(true);
    setIsMenuOpen(false);
  };

  const handleSaveEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    onEditPost?.(post.id, editContent.trim(), editImageUrl.trim() || undefined);
    setIsEditing(false);
    setToastMessage("貼文內容已順利更新！");
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleConfirmDeletePost = () => {
    setShowDeleteConfirm(false);
    setIsMenuOpen(false);
    onDeletePost?.(post.id);
  };

  const handleToggleDiscussion = () => {
    setShowComments((prev) => !prev);
    setIsMenuOpen(false);
  };

  // Format content text with interactive hashtag chips
  const renderFormattedContent = (text: string) => {
    const parts = text.split(/(#[a-zA-Z0-9_\u4e00-\u9fa5]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("#")) {
        const tag = part.substring(1);
        return (
          <button
            key={i}
            onClick={() => onHashtagClick(tag)}
            className="text-emerald-600 hover:text-emerald-700 font-semibold inline-block hover:underline cursor-pointer transition-colors px-0.5"
          >
            {part}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Age restriction check for post
  const isPostRestricted =
    !post.isPrivate &&
    isContentAgeRestricted(post.moderation.ageRating, userBirthDate);

  const toggleRevealComment = (commentId: string) => {
    setRevealedCommentIds((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  if (isBlockedAuthor) {
    return (
      <article className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-500 flex items-center justify-between">
        <span>已隱藏來自經您封鎖的使用者的貼文 ({post.authorName})</span>
        <button
          onClick={() => onToggleBlock(post.authorId)}
          className="text-emerald-600 font-bold hover:underline cursor-pointer"
        >
          解除封鎖
        </button>
      </article>
    );
  }

  if (isNotInterested) {
    return (
      <article className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-500 flex items-center justify-between animate-fadeIn">
        <span>已將此貼文標示為不感興趣（已為您隱藏）</span>
        <button
          onClick={() => setIsNotInterested(false)}
          className="text-emerald-600 font-bold hover:underline cursor-pointer"
        >
          取消隱藏
        </button>
      </article>
    );
  }

  return (
    <article className="bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all overflow-hidden relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-slate-800/90 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-md animate-fadeIn">
          {toastMessage}
        </div>
      )}

      {/* Post Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatarMenu
            user={{
              id: post.authorId,
              name: post.authorName,
              avatar: post.authorAvatar,
              handle: post.authorHandle,
            }}
            currentUserId={currentUserId}
            isBlocked={blockedUserIds.includes(post.authorId)}
            onViewProfile={onViewProfile}
            onToggleBlock={onToggleBlock}
            onOpenReport={(u) => onOpenReport(u, post)}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800 text-sm truncate">
                {post.authorName}
              </span>
              {isInterested && (
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  感興趣
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span>
                {new Date(post.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {post.isPrivate && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-slate-500 font-medium">
                    <Lock className="w-3 h-3" />
                    私人
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Top Right Three-Dots Menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="開啟貼文選單"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* Three-dots Menu Dropdown */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-8 z-30 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 animate-fadeIn text-xs text-slate-700 font-medium">
                {/* 1. 不感興趣 */}
                <button
                  onClick={handleNotInterestedAction}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <ThumbsDown className="w-4 h-4 text-slate-400" />
                  <span>不感興趣</span>
                </button>

                {/* 2. 感興趣 */}
                <button
                  onClick={handleInterestedAction}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-emerald-50 text-emerald-700 transition-colors text-left cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>感興趣</span>
                </button>

                {/* 3. 檢舉這個貼文 */}
                <button
                  onClick={handleReportAction}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-amber-50 text-amber-700 transition-colors text-left cursor-pointer border-t border-slate-100/80"
                >
                  <Flag className="w-4 h-4 text-amber-500" />
                  <span>檢舉這個貼文</span>
                </button>

                {/* 4. 修改這個貼文（僅發佈者） */}
                {isAuthor && (
                  <button
                    onClick={handleOpenEditModal}
                    className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-blue-50 text-blue-700 transition-colors text-left cursor-pointer border-t border-slate-100/80"
                  >
                    <Edit3 className="w-4 h-4 text-blue-500" />
                    <span>修改這個貼文 (僅發佈者)</span>
                  </button>
                )}

                {/* 5. 刪除這個貼文（僅發佈者以及管理員） */}
                {canDelete && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-rose-50 text-rose-600 transition-colors text-left cursor-pointer font-semibold border-t border-slate-100/80"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span>刪除這個貼文 (發佈者/管理員)</span>
                  </button>
                )}

                {/* 6. 討論 */}
                <button
                  onClick={handleToggleDiscussion}
                  className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-slate-50 transition-colors text-left cursor-pointer border-t border-slate-100/80"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>討論區 ({comments.length || post.commentsCount})</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Post Body */}
      <div className="p-4 space-y-3">
        {isPostRestricted && !isPostForceRevealed ? (
          <div className="p-5 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-center space-y-2.5 my-1">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-900">
              <EyeOff className="w-4 h-4 text-amber-600 shrink-0" />
              <span>這則貼文不符合您的年齡層，確定要觀看嗎？</span>
            </div>
            <button
              onClick={() => setIsPostForceRevealed(true)}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer inline-block"
            >
              確定觀看
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line font-normal">
              {renderFormattedContent(post.content)}
            </p>

            {/* Image Attachment */}
            {post.imageUrl && (
              <div className="rounded-2xl overflow-hidden border border-slate-100 max-h-96">
                <img
                  src={post.imageUrl}
                  alt="Post attachment"
                  className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-300"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Footer: Like, Comment, Save, Share */}
      <div className="px-4 py-3 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-4">
          {/* Like */}
          <button
            onClick={() => onLike(post.id)}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              post.likedByMe ? "text-rose-500 font-bold" : "hover:text-rose-500"
            }`}
          >
            <Heart
              className={`w-4 h-4 ${post.likedByMe ? "fill-rose-500" : ""}`}
            />
            <span>{post.likes}</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{comments.length || post.commentsCount} 討論</span>
          </button>

          {/* Save Record */}
          <button
            onClick={() => onSave(post.id)}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              post.savedByMe ? "text-emerald-600 font-bold" : "hover:text-emerald-600"
            }`}
            title="儲存紀錄 / 收藏"
          >
            <Bookmark
              className={`w-4 h-4 ${post.savedByMe ? "fill-emerald-600" : ""}`}
            />
            <span>{post.savedByMe ? "已儲存" : "儲存"}</span>
          </button>
        </div>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>{copied ? "已複製連結" : "分享"}</span>
        </button>
      </div>

      {/* Discussion / Comment Section */}
      {showComments && (
        <div className="bg-slate-50/80 p-4 border-t border-slate-100 space-y-3 animate-fadeIn">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <CornerDownRight className="w-3.5 h-3.5 text-emerald-500" />
            貼文討論區 ({comments.length})
          </h4>

          {/* Comments List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">
                尚無留言，來成為第一個討論的人吧！
              </p>
            ) : (
              comments.map((c) => {
                const isCommentRestricted =
                  isPostRestricted && !revealedCommentIds[c.id];

                return (
                  <div
                    key={c.id}
                    className="bg-white p-2.5 rounded-xl border border-slate-100 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatarMenu
                          user={{
                            id: c.authorHandle ? c.authorHandle : c.authorName,
                            name: c.authorName,
                            avatar: c.authorAvatar,
                            handle: c.authorHandle,
                          }}
                          currentUserId={currentUserId}
                          isBlocked={blockedUserIds.includes(c.authorHandle || c.authorName)}
                          onViewProfile={onViewProfile}
                          onToggleBlock={onToggleBlock}
                          onOpenReport={(u) => onOpenReport(u, post)}
                        />
                        <span className="font-bold text-slate-800 truncate">
                          {c.authorName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(c.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {isCommentRestricted ? (
                      <div className="pt-1 flex items-center justify-between text-[11px] text-amber-800 bg-amber-50/80 p-2 rounded-lg border border-amber-100">
                        <span>這則留言不符合您的年齡層，確定要觀看嗎？</span>
                        <button
                          onClick={() => toggleRevealComment(c.id)}
                          className="ml-2 px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-md shrink-0 cursor-pointer"
                        >
                          確定觀看
                        </button>
                      </div>
                    ) : (
                      <p className="text-slate-600 pt-0.5">{c.content}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Comment Input */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-1">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="發表你的看法..."
              disabled={isSubmittingComment}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!newCommentText.trim() || isSubmittingComment}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs shrink-0"
            >
              {isSubmittingComment ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>傳送中</span>
                </>
              ) : (
                "傳送"
              )}
            </button>
          </form>
        </div>
      )}

      {/* Modal: Edit Post */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 animate-scaleUp border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-600" />
                修改貼文內容 (發佈者專屬)
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">貼文內文</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                  placeholder="輸入新的貼文內容..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">圖片網址 (選填)</label>
                <input
                  type="text"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  儲存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-4 animate-scaleUp border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">確定刪除這則貼文嗎？</h3>
              <p className="text-xs text-slate-500 mt-1">刪除後無法復原，將會從 Happi 社群雲端資料庫中永久移除。</p>
            </div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDeletePost}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
              >
                確定刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
