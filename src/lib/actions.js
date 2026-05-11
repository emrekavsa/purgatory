"use server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

// Server-side client — service role key kullanır, RLS bypass eder
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Schemas
const createPollSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: z.string(),
  user_id: z.string().uuid("Invalid user ID"),
})

const voteSchema = z.object({
  poll_id: z.string().uuid("Invalid poll ID"),
  option_id: z.string().uuid("Invalid option ID"),
  user_id: z.string().uuid("Invalid user ID"),
})

const createCommentSchema = z.object({
  poll_id: z.string().uuid("Invalid poll ID"),
  user_id: z.string().uuid("Invalid user ID"),
  content: z.string().min(1, "Comment cannot be empty"),
  parent_id: z.string().uuid("Invalid parent ID").nullable().optional(),
})

const deleteCommentSchema = z.object({
  comment_id: z.string().uuid("Invalid comment ID"),
  user_id: z.string().uuid("Invalid user ID"),
})

const updateCommentSchema = z.object({
  comment_id: z.string().uuid("Invalid comment ID"),
  user_id: z.string().uuid("Invalid user ID"),
  content: z.string().min(1, "Comment cannot be empty"),
})

const deletePollSchema = z.object({
  poll_id: z.string().uuid("Invalid poll ID"),
  user_id: z.string().uuid("Invalid user ID"),
})

// Anket oluştur
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
      const { error: optErr } = await supabase.from("poll_options").insert([
        {
          poll_id: poll.id,
          content: optionsData[i].content,
          image_url: optionsData[i].image_url ?? null,
          option_type: optionsData[i].image_url ? "image" : "text", // EKLENDİ
        },
      ])

      if (optErr) throw new Error(`Option ${i + 1} error: ${optErr.message}`) // EKLENDİ
    }

    return { success: true, pollId: poll.id }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Anket sil (PollCard'dan taşındı — güvenli)
export async function deletePollAction(data) {
  try {
    const validatedData = deletePollSchema.parse(data)

    const { error } = await supabase
      .from("polls")
      .delete()
      .eq("id", validatedData.poll_id)
      .eq("user_id", validatedData.user_id) // sadece kendi pollunu silebilir

    if (error) throw new Error(error.message)

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Oy ver
export async function voteAction(voteData) {
  try {
    const validatedData = voteSchema.parse(voteData)

    const { error } = await supabase.from("votes").insert([validatedData])

    // Unique constraint ihlali → zaten oy verilmiş
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

// Yorum ekle
export async function createCommentAction(commentData) {
  try {
    const validatedData = createCommentSchema.parse(commentData)

    const { error } = await supabase.from("comments").insert([validatedData])

    if (error) throw new Error(error.message)

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Yorum sil
export async function deleteCommentAction(data) {
  try {
    const validatedData = deleteCommentSchema.parse(data)

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", validatedData.comment_id)
      .eq("user_id", validatedData.user_id)

    if (error) throw new Error(error.message)

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Yorum güncelle
export async function updateCommentAction(data) {
  try {
    const validatedData = updateCommentSchema.parse(data)
    const now = new Date().toISOString()

    const { error } = await supabase
      .from("comments")
      .update({ content: validatedData.content, updated_at: now })
      .eq("id", validatedData.comment_id)
      .eq("user_id", validatedData.user_id)

    if (error) throw new Error(error.message)

    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}