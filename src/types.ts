export type TimeLimitCycle = "1h" | "3h" | "1d";

export interface TimeLimitConfig {
  enabled: boolean;
  cycle: TimeLimitCycle;
  limitMinutes: number;
  usedMinutes?: number;
  cycleStartTime?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  birthDate: string | null;
  bio?: string;
  registeredAt: string;
  hasCompletedBirthDatePrompt: boolean;
  isGuest?: boolean;
  timeLimit?: TimeLimitConfig;
  email?: string;
  password?: string;
  isMuted?: boolean;
  mutedUntil?: string;
  isBanned?: boolean;
  bannedUntil?: string;
  blockHistory?: { date: string; reason: string; action: string }[];
}

export type ModerationStatus = "pending" | "approved" | "restricted" | "blocked";

export interface PostModeration {
  status: ModerationStatus;
  ageRating: string;
  reason: string;
  stage: string;
  hasAppealed?: boolean;
  userAppealReason?: string;
  appealStage?: "none" | "second_completed" | "third_requested" | "third_completed";
  secondStageReason?: string;
  thirdStageReason?: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorHandle: string;
  content: string;
  hashtags: string[];
  imageUrl?: string;
  isPrivate: boolean;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
  savedByMe: boolean;
  commentsCount: number;
  moderation: PostModeration;
}

export interface Comment {
  id: string;
  postId: string;
  authorName: string;
  authorAvatar: string;
  authorHandle: string;
  content: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type:
    | "moderation_complete"
    | "appeal_complete"
    | "like"
    | "comment"
    | "system"
    | "report_result"
    | "penalty_notice"
    | "manual_review_request";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  postId?: string;
  ageRating?: string;
  stage?: string;
  reportId?: string;
  targetUserId?: string;
  targetUserName?: string;
  penaltyType?: "none" | "warning" | "mute" | "ban";
  penaltyDurationDays?: number;
  reporterId?: string;
  reporterName?: string;
  appealStatus?: "none" | "pending" | "approved" | "rejected";
  appealReason?: string;
}

export type ActiveTab = "home" | "explore" | "create" | "notifications" | "profile" | "saved";
