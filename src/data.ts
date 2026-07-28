import { Post, User, Notification, Comment } from "./types";

export const INITIAL_USER: User = {
  id: "u_new_user",
  username: "happi_member",
  name: "Happi 會員",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  birthDate: null,
  bio: "分享生活的點滴 🌿",
  registeredAt: new Date().toISOString(),
  hasCompletedBirthDatePrompt: true,
  timeLimit: {
    enabled: true,
    cycle: "1h",
    limitMinutes: 30,
    usedMinutes: 0,
    cycleStartTime: new Date().toISOString(),
  },
};

// 刪除假數據，初始狀態為空陣列
export const INITIAL_POSTS: Post[] = [];

export const INITIAL_NOTIFICATIONS: Notification[] = [];

export const INITIAL_COMMENTS: Comment[] = [];

export function extractHashtags(text: string): string[] {
  if (!text) return [];
  const regex = /#([a-zA-Z0-9_\u4e00-\u9fa5]+)/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1] && !matches.includes(match[1])) {
      matches.push(match[1]);
    }
  }
  return matches;
}
