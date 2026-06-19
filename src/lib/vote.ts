import { supabase } from "@/lib/supabase"
import type { AppUser, Poll } from "@/types/domain"

const POLL_SELECT = "*, profiles(username, id, avatar_url), poll_options(id, content, image_url, votes(user_id)), comments(id)"

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
    const { data: updatedPoll } = await supabase
      .from("polls")
      .select(POLL_SELECT)
      .eq("id", pollId)
      .single()

    if (updatedPoll) onSuccess(updatedPoll as Poll)
  } else if (error.message.includes("duplicate key") || error.message.includes("unique constraint")) {
    alert("You already voted!")
  } else {
    alert(error.message)
  }
}
