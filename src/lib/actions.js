"use server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServerKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServerKey) {
  throw new Error(
    "Missing Supabase server env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY)"
  )
}

const supabase = createClient(
  supabaseUrl,
  supabaseServerKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

const createPollSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: z.string(),
  auth_token: z.string().min(1, "Missing auth token"),
})

const voteSchema = z.object({
  poll_id: z.string().uuid("Invalid poll ID"),
  option_id: z.string().uuid("Invalid option ID"),
  auth_token: z.string().min(1, "Missing auth token"),
})

const createCommentSchema = z.object({
  poll_id: z.string().uuid("Invalid poll ID"),
  content: z.string().min(1, "Comment cannot be empty"),
  parent_id: z.string().uuid("Invalid parent ID").nullable().optional(),
  auth_token: z.string().min(1, "Missing auth token"),
})

const deleteCommentSchema = z.object({
  comment_id: z.string().uuid("Invalid comment ID"),
  auth_token: z.string().min(1, "Missing auth token"),
})

const updateCommentSchema = z.object({
  comment_id: z.string().uuid("Invalid comment ID"),
  content: z.string().min(1, "Comment cannot be empty"),
  auth_token: z.string().min(1, "Missing auth token"),
})

const deletePollSchema = z.object({
  poll_id: z.string().uuid("Invalid poll ID"),
  auth_token: z.string().min(1, "Missing auth token"),
})

async function getAuthenticatedUserId(authToken) {
  const { data, error } = await supabase.auth.getUser(authToken)
  if (error || !data?.user?.id) {
    throw new Error("Unauthorized")
  }
  return data.user.id
}

export async function createPollAction(pollData, optionsData) {
  try {
    const validatedData = createPollSchema.parse(pollData)
    const userId = await getAuthenticatedUserId(validatedData.auth_token)

    const { data: poll, error: pollErr } = await supabase
      .from("polls")
      .insert([{
        title: validatedData.title,
        category: validatedData.category,
        user_id: userId,
      }])
      .select()
      .single()

    if (pollErr) throw new Error(pollErr.message)

    for (let i = 0; i < optionsData.length; i++) {
      const { error: optErr } = await supabase.from("poll_options").insert([{
        poll_id: poll.id,
        content: optionsData[i].content,
        image_url: optionsData[i].image_url ?? null,
        option_type: optionsData[i].image_url ? "image" : "text",
      }])

      if (optErr) throw new Error(`Option ${i + 1} error: ${optErr.message}`)
    }

    return { success: true, pollId: poll.id }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function deletePollAction(data) {
  try {
    const validatedData = deletePollSchema.parse(data)
    const userId = await getAuthenticatedUserId(validatedData.auth_token)

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()

    const isAdmin = profile?.is_admin === true

    let query = supabase.from('polls').delete().eq('id', validatedData.poll_id)

    if (!isAdmin) {
      query = query.eq('user_id', userId)
    }

    const { error } = await query
    if (error) throw new Error(error.message)

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function voteAction(voteData) {
  try {
    const validatedData = voteSchema.parse(voteData)
    const userId = await getAuthenticatedUserId(validatedData.auth_token)

    const { data: option, error: optionErr } = await supabase
      .from("poll_options")
      .select("poll_id")
      .eq("id", validatedData.option_id)
      .maybeSingle()

    if (optionErr) throw new Error(optionErr.message)
    if (!option || option.poll_id !== validatedData.poll_id) {
      return { success: false, error: "Option does not belong to this poll" }
    }

    const { error } = await supabase.from("votes").insert([{
      poll_id: validatedData.poll_id,
      option_id: validatedData.option_id,
      user_id: userId,
    }])

    if (error) {
      if (error.code === "23505") {
        return { success: false, alreadyVoted: true, error: "already_voted" }
      }
      throw new Error(error.message)
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function createCommentAction(commentData) {
  try {
    const validatedData = createCommentSchema.parse(commentData)
    const userId = await getAuthenticatedUserId(validatedData.auth_token)

    const { error } = await supabase.from("comments").insert([{
      poll_id: validatedData.poll_id,
      user_id: userId,
      content: validatedData.content,
      parent_id: validatedData.parent_id ?? null,
    }])

    if (error) throw new Error(error.message)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function deleteCommentAction(data) {
  try {
    const validatedData = deleteCommentSchema.parse(data)
    const userId = await getAuthenticatedUserId(validatedData.auth_token)

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()

    const isAdmin = profile?.is_admin === true

    let query = supabase.from('comments').delete().eq('id', validatedData.comment_id)

    if (!isAdmin) {
      query = query.eq('user_id', userId)
    }

    const { error } = await query
    if (error) throw new Error(error.message)

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function updateCommentAction(data) {
  try {
    const validatedData = updateCommentSchema.parse(data)
    const userId = await getAuthenticatedUserId(validatedData.auth_token)
    const now = new Date().toISOString()

    const { error } = await supabase
      .from("comments")
      .update({ content: validatedData.content, updated_at: now })
      .eq("id", validatedData.comment_id)
      .eq("user_id", userId)

    if (error) throw new Error(error.message)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
