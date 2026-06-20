import type { User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
  is_admin?: boolean | null;
  isbanned?: boolean | null;
  [key: string]: unknown;
};

export type AppUser = User & {
  username?: string;
  avatar_url?: string | null;
  is_admin?: boolean;
  isbanned?: boolean;
};

export type Vote = {
  user_id: string;
  [key: string]: unknown;
};

export type PollOption = {
  id: string;
  content: string;
  image_url?: string | null;
  option_type?: string | null;
  vote_count?: number | string | null;
  votes?: Vote[];
  [key: string]: unknown;
};

export type Poll = {
  id: string;
  title?: string;
  category?: string | null;
  created_at?: string | null;
  user_id?: string | null;
  profiles?: Profile | null;
  poll_options?: PollOption[];
  comment_count?: number | string | null;
  comments?: Array<{ id: string; [key: string]: unknown }>;
  [key: string]: unknown;
};

export type CommentRecord = {
  id: string;
  poll_id?: string | null;
  user_id?: string | null;
  content: string;
  parent_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  profiles?: Profile | null;
  [key: string]: unknown;
};

export type ActionResult<T = Record<string, unknown>> =
  | ({ success: true } & T)
  | { success: false; error: string };

export type ReportTargetType = "Poll" | "Comment";

export type ReportRecord = {
  id: string;
  status?: string | null;
  reason?: string | null;
  created_at?: string | null;
  poll_id?: string | null;
  comment_id?: string | null;
  polls?: Poll | null;
  comments?: CommentRecord | null;
  profiles?: Profile | null;
  [key: string]: unknown;
};
