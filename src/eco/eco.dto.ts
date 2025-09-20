// src/eco/types.ts
export interface LeaderboardUser {
  userId: string; // convert ObjectId to string
  username: string;
  balance: number;
  position?: number; // for current user if not in top 5
}

export interface LeaderboardResult {
  top5: LeaderboardUser[];
  userRank: LeaderboardUser | null;
}
