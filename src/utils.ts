export function calculateAge(birthDateStr: string | null | undefined): number {
  if (!birthDateStr) return 0;
  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age < 0 ? 0 : age;
}

export function isContentAgeRestricted(
  ageRating: string | undefined,
  userBirthDate: string | null | undefined
): boolean {
  if (!ageRating) return false;
  
  if (
    ageRating.includes("所有年齡") ||
    ageRating.includes("不限") ||
    ageRating.includes("0-99")
  ) {
    return false;
  }

  const userAge = calculateAge(userBirthDate);

  if (ageRating.includes("18")) {
    return userAge < 18;
  }
  if (ageRating.includes("16")) {
    return userAge < 16;
  }
  if (ageRating.includes("12")) {
    return userAge < 12;
  }

  return false;
}

export function compressImage(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

import { TimeLimitCycle } from "./types";

export const CYCLE_TOTAL_MINUTES: Record<TimeLimitCycle, number> = {
  "1h": 60,
  "3h": 180,
  "1d": 1440,
};

export const CYCLE_NAMES: Record<TimeLimitCycle, string> = {
  "1h": "1 小時 (60 分鐘)",
  "3h": "3 小時 (180 分鐘)",
  "1d": "1 天 (24 小時 / 1440 分鐘)",
};

export function getTimeLimitBounds(cycle: TimeLimitCycle) {
  const total = CYCLE_TOTAL_MINUTES[cycle];
  const minMinutes = Math.ceil(total * 0.1); // 10%
  const maxMinutes = Math.floor(total * 0.9); // 90%
  return { total, minMinutes, maxMinutes };
}

export function checkIsAdmin(user?: { username?: string; id?: string; email?: string; name?: string } | null): boolean {
  if (!user) return false;
  return (
    user.username === "admin" ||
    user.id === "admin" ||
    user.email === "admin@happi.com" ||
    user.email === "yifan.liu0808@gmail.com"
  );
}

export const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
];

export function validateTimeLimitMinutes(cycle: TimeLimitCycle, minutes: number): string | null {
  const { minMinutes, maxMinutes } = getTimeLimitBounds(cycle);
  if (isNaN(minutes) || minutes < minMinutes) {
    return `時限不能低於該週期的 10%（最小 ${minMinutes} 分鐘）`;
  }
  if (minutes > maxMinutes) {
    return `時限不能高於該週期的 90%（最大 ${maxMinutes} 分鐘）`;
  }
  return null;
}
