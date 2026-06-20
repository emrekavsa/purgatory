import { supabase } from "@/lib/supabase";
import type { Poll } from "@/types/domain";

type FetchPollCardsParams = {
  category?: string | null;
  search?: string | null;
  profileUsername?: string | null;
  pollId?: string | null;
  limit?: number;
  offset?: number;
  sort?: string | null;
};

export async function fetchPollCards({
  category = null,
  search = null,
  profileUsername = null,
  pollId = null,
  limit = 10,
  offset = 0,
  sort = 'newest',
}: FetchPollCardsParams = {}): Promise<Poll[]> {
  const { data, error } = await supabase.rpc("get_poll_cards", {
    p_category: category,
    p_search: search,
    p_profile_username: profileUsername,
    p_poll_id: pollId,
    p_limit: limit,
    p_offset: offset,
    p_sort: sort,
  });

  if (error) throw error;
  return Array.isArray(data) ? (data as Poll[]) : [];
}

export async function fetchPollCard(pollId: string): Promise<Poll | null> {
  const polls = await fetchPollCards({ pollId, limit: 1 });
  return polls[0] ?? null;
}
