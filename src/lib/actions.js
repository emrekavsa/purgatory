"use server"
import { supabase } from "@/lib/supabase"
import { z } from "zod"

// Anket
const createPollSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: z.string(),
  user_id: z.string().uuid("Invalid user ID")
})

// Oy 
const voteSchema = z.object({
  poll_id: z.string().uuid("Invalid poll ID"),
  option_id: z.string().uuid("Invalid option ID"),
  user_id: z.string().uuid("Invalid user ID")
})

// Yorum check
const createCommentSchema = z.object({
  poll_id: z.string().uuid("Invalid poll ID"),
  user_id: z.string().uuid("Invalid user ID"),
  content: z.string().min(1, "Comment cannot be empty"),
  parent_id: z.string().uuid("Invalid parent ID").nullable().optional()
})

// delete check
const deleteCommentSchema = z.object({
  comment_id: z.string().uuid("Invalid comment ID"),
  user_id: z.string().uuid("Invalid user ID")
})

// update check
const updateCommentSchema = z.object({
  comment_id: z.string().uuid("Invalid comment ID"),
  user_id: z.string().uuid("Invalid user ID"),
  content: z.string().min(1, "Comment cannot be empty")
})

//  anket oluştur
export async function createPollAction(pollData, optionsData) {
  try {
    const validatedData = createPollSchema.parse(pollData)

    const { data: poll, error: pollErr } = await supabase
      .from("polls")
      .insert([validatedData])
      .select()
      .single()

    if (pollErr) throw new Error(pollErr.message)

    for (let i = 0; i < optionsData.length; i++) {
      await supabase.from("poll_options").insert([{
        poll_id: poll.id,
        content: optionsData[i].content,
        image_url: optionsData[i].image_url
      }])
    }

    return { success: true, pollId: poll.id }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// oy verme
export async function voteAction(voteData) {
  try {
    const validatedData = voteSchema.parse(voteData)

    const { error } = await supabase
      .from('votes')
      .insert([validatedData])

    if (error) throw new Error(error.message)

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function createCommentAction(commentData) {
  try {
    const validatedData = createCommentSchema.parse(commentData)

    const { error } = await supabase
      .from('comments')
      .insert([validatedData])

    if (error) throw new Error(error.message)

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// yorum silme
export async function deleteCommentAction(data) {
  try {
    const validatedData = deleteCommentSchema.parse(data)

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', validatedData.comment_id)
      .eq('user_id', validatedData.user_id)

    if (error) throw new Error(error.message)

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

export async function updateCommentAction(data) {
  try {
    const validatedData = updateCommentSchema.parse(data)
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('comments')
      .update({ content: validatedData.content, updated_at: now })
      .eq('id', validatedData.comment_id)
      .eq('user_id', validatedData.user_id)

    if (error) throw new Error(error.message)

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}