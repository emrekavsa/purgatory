import { supabase } from '@/lib/supabase'

export const POLL_SELECT = '*, profiles(username, id), poll_options(id, content, image_url, votes(user_id)), comments(id)'


export async function castVote(pollId, optionId, userId) {
  const { error } = await supabase
    .from('votes')
    .insert([{ poll_id: pollId, option_id: optionId, user_id: userId }])
  return error
}

export async function handleVote(pollId, optionId, user, setPolls, onLoginRequired) {
  if (!user) {
    if (onLoginRequired) onLoginRequired()
    return
  }

  const error = await castVote(pollId, optionId, user.id)

  if (!error) {
    const { data } = await supabase
      .from('polls')
      .select(POLL_SELECT)
      .eq('id', pollId)
      .single()
    if (data) setPolls(prev => prev.map(p => p.id === pollId ? data : p))
  } else if (error.code === '23505') {
    alert('You have already voted!')
  }
}