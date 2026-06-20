import { supabase } from "@/lib/supabase";
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

  const { error } = await supabase
    .from("votes")
    .insert([{ poll_id: poll.id, option_id: optionId, user_id: user.id }]);

  if (!error) {
    const updatedPoll = await fetchPollCard(poll.id);
    if (updatedPoll) onSuccess(updatedPoll);
  } else if (
    error.message.includes("duplicate key") ||
    error.message.includes("unique constraint")
  ) {
    alert("You already voted!");
  } else {
    // Revert optimistic update on error
    onSuccess(poll);
    alert(error.message);
  }
}
