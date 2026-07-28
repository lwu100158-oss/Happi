import React, { useState } from "react";
import { Hash, Search, TrendingUp } from "lucide-react";
import { Post, Comment } from "../types";
import { PostCard } from "./PostCard";

interface HashtagsExplorePageProps {
  posts: Post[];
  comments: Comment[];
  userBirthDate?: string | null;
  currentUserId: string;
  currentUserIsAdmin?: boolean;
  blockedUserIds?: string[];
  selectedHashtag: string | null;
  onSelectHashtag: (tag: string) => void;
  onClearHashtag: () => void;
  onLike: (postId: string) => void;
  onSave: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onOpenAppeal: (post: Post) => void;
  onViewProfile?: (userId: string) => void;
  onToggleBlock?: (userId: string) => void;
  onOpenReport?: (user: any, post?: Post) => void;
  onEditPost?: (postId: string, newContent: string, newImageUrl?: string) => void;
  onDeletePost?: (postId: string) => void;
}

export const HashtagsExplorePage: React.FC<HashtagsExplorePageProps> = ({
  posts,
  comments,
  userBirthDate,
  currentUserId,
  currentUserIsAdmin = false,
  blockedUserIds = [],
  selectedHashtag,
  onSelectHashtag,
  onClearHashtag,
  onLike,
  onSave,
  onAddComment,
  onOpenAppeal,
  onViewProfile,
  onToggleBlock,
  onOpenReport,
  onEditPost,
  onDeletePost,
}) => {
  const [searchInput, setSearchInput] = useState("");

  // Collect all unique hashtags across posts and count frequencies
  const hashtagCounts: Record<string, number> = {};
  posts.forEach((post) => {
    post.hashtags.forEach((tag) => {
      hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(hashtagCounts).sort((a, b) => b[1] - a[1]);

  const filteredTags = sortedTags.filter(([tag]) =>
    tag.toLowerCase().includes(searchInput.toLowerCase().replace("#", ""))
  );

  const activeTagPosts = selectedHashtag
    ? posts.filter((p) => p.hashtags.includes(selectedHashtag))
    : [];

  return (
    <div className="max-w-xl mx-auto p-4 space-y-4">
      {/* Search Header */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">探索熱門 #hashtag 標籤</h2>
            <p className="text-xs text-slate-400">發掘最受歡迎的主題與討論</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜尋標籤 (如：happi, 薄荷, 咖啡...)"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      </div>

      {/* Selected Tag View or Trending List */}
      {selectedHashtag ? (
        <div className="space-y-4">
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-emerald-800">#{selectedHashtag}</span>
              <span className="text-xs text-emerald-600">({activeTagPosts.length} 篇貼文)</span>
            </div>
            <button
              onClick={onClearHashtag}
              className="text-xs text-emerald-700 hover:underline font-bold cursor-pointer"
            >
              清除篩選
            </button>
          </div>

          <div className="space-y-4">
            {activeTagPosts.map((post) => (
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
                onHashtagClick={onSelectHashtag}
                onOpenAppeal={onOpenAppeal}
                onViewProfile={onViewProfile}
                onToggleBlock={onToggleBlock}
                onOpenReport={onOpenReport}
                onEditPost={onEditPost}
                onDeletePost={onDeletePost}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>熱門標籤榜</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {filteredTags.map(([tag, count]) => (
              <button
                key={tag}
                onClick={() => onSelectHashtag(tag)}
                className="p-3 bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 rounded-2xl text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                  #{tag}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{count} 篇討論貼文</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
