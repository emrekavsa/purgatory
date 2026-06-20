import { supabase } from "@/lib/supabase"
import { fetchPollCard } from "@/lib/polls"
import type { AppUser, Poll } from "@/types/domain"

type HandleVoteParams = {
  user: AppUser | null
  pollId: string
  optionId: string
  requireLogin: () => void
  onSuccess: (poll: Poll) => void
}

export async function handleVote({ user, pollId, optionId, requireLogin, onSuccess }: HandleVoteParams) {
  if (!user) return requireLogin()

  const { error } = await supabase
    .from("votes")
    .insert([{ poll_id: pollId, option_id: optionId, user_id: user.id }])

  if (!error) {
    const updatedPoll = await fetchPollCard(pollId)

    if (updatedPoll) onSuccess(updatedPoll)
  } else if (error.message.includes("duplicate key") || error.message.includes("unique constraint")) {
    alert("You already voted!")
  } else {
    alert(error.message)
  }
}
