import { createClient } from "@/lib/supabase/client";
import { fetchPollCard } from "@/lib/polls";
import type { AppUser, Poll } from "@/types/domain";

type HandleVoteParams = {
  user: AppUser | null;
  poll: Poll;
  optionId: string;
  requireLogin: () => void;
  onOptimistic: (poll: Poll) => void;
  onSuccess: (poll: Poll) => void;
};

export async function handleVote({
  user,
  poll,
  optionId,
  requireLogin,
  onOptimistic,
  onSuccess,
}: HandleVoteParams) {
  if (!user) return requireLogin();
  if (!poll.poll_options?.some((option) => option.id === optionId)) return;
  const supabase = createClient();

  // Optimistic update: mutate local state immediately, no extra fetch
  const optimisticPoll: Poll = {
    ...poll,
    poll_options: poll.poll_options?.map((opt) => ({
      ...opt,
      vote_count:
        opt.id === optionId ? Number(opt.vote_count ?? 0) + 1 : opt.vote_count,
      votes:
        opt.id === optionId
          ? [...(opt.votes ?? []), { user_id: user.id }]
          : opt.votes,
    })),
  };
  onOptimistic(optimisticPoll);

  try {
    const { error } = await supabase
      .from("votes")
      .insert([{ poll_id: poll.id, option_id: optionId, user_id: user.id }]);

    if (error) {
      onSuccess(poll);

      if (
        error.code === "23505" ||
        error.message.includes("duplicate key") ||
        error.message.includes("unique constraint")
      ) {
        alert("You already voted!");
      } else {
        alert(error.message);
      }
      return;
    }

    const updatedPoll = await fetchPollCard(supabase, poll.id);
    onSuccess(updatedPoll ?? optimisticPoll);
  } catch {
    // The insert may already have succeeded, so preserve the optimistic vote
    // and let the next poll refresh reconcile the authoritative totals.
    onSuccess(optimisticPoll);
  }
}
