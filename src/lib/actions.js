"use server"
import { supabase } from "@/lib/supabase"
import { z } from "zod"

const createPollSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: z.string(),
  user_id: z.string().uuid("Invalid user ID")
})

const voteSchema = z.object({
  poll_id: z.string().uuid("Invalid poll ID"),
  option_id: z.string().uuid("Invalid option ID"),
  user_id: z.string().uuid("Invalid user ID")
})

const createCommentSchema = z.object({
  poll_id: z.string().uuid("Invalid poll ID"),
  user_id: z.string().uuid("Invalid user ID"),
  content: z.string().min(1, "Comment cannot be empty"),
  parent_id: z.string().uuid("Invalid parent ID").nullable().optional()
})

const deleteCommentSchema = z.object({
  comment_id: z.string().uuid("Invalid comment ID"),
  user_id: z.string().uuid("Invalid user ID")
})

const updateCommentSchema = z.object({
  comment_id: z.string().uuid("Invalid comment ID"),
  user_id: z.string().uuid("Invalid user ID"),
  content: z.string().min(1, "Comment cannot be empty")
})

// GÜVENLİK FİX: .refine ile poll_id veya comment_id'den en az birinin dolu olması zorunlu kılındı.
const reportSchema = z.object({
  poll_id: z.string().uuid("Invalid poll ID").optional(),
  comment_id: z.string().uuid("Invalid comment ID").optional(),
  reported_by: z.string().uuid("Invalid user ID"),
  reason: z.string().optional()
}).refine(data => data.poll_id || data.comment_id, {
  message: "Either poll_id or comment_id must be provided"
})

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
        option_type: optionsData[i].option_type || 'text',
        content: optionsData[i].content,
        image_url: optionsData[i].image_url
      }])
    }

    return { success: true, pollId: poll.id }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

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

export async function reportAction(data) {
  try {
    const validatedData = reportSchema.parse(data)

    const insertData = {
      reported_by: validatedData.reported_by,
      reason: validatedData.reason,
      status: 'pending'
    }

    if (validatedData.poll_id) insertData.poll_id = validatedData.poll_id
    if (validatedData.comment_id) insertData.comment_id = validatedData.comment_id

    const { error } = await supabase
      .from('reports')
      .insert([insertData])

    if (error) throw new Error(error.message)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// GÜVENLİK FİX: Sadece gerçek adminler DB'ye ban atabilir.
export async function banUserAction(adminId, userId, status = true) {
  try {
    if (!adminId) throw new Error("Unauthorized: Admin ID is required")

    // 1. İşlemi tetikleyen kişi gerçekten admin mi kontrol et
    const { data: adminCheck } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', adminId)
      .single()

    if (!adminCheck?.is_admin) throw new Error("CRITICAL: Unauthorized admin action attempt.")

    // 2. Yetki doğrulandı, işlemi yap
    const { error } = await supabase
      .from('profiles')
      .update({ isbanned: status })
      .eq('id', userId)

    if (error) throw new Error(error.message)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// GÜVENLİK FİX: Sadece gerçek adminler raporu kapatabilir.
export async function resolveReportAction(adminId, reportId) {
  try {
    if (!adminId) throw new Error("Unauthorized: Admin ID is required")

    const { data: adminCheck } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', adminId)
      .single()

    if (!adminCheck?.is_admin) throw new Error("CRITICAL: Unauthorized admin action attempt.")

    const { error } = await supabase
      .from('reports')
      .update({ status: 'resolved' })
      .eq('id', reportId)

    if (error) throw new Error(error.message)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// GÜVENLİK FİX: Sadece gerçek adminler anketi silebilir.
export async function deletePollAction(adminId, pollId) {
  try {
    if (!adminId) throw new Error("Unauthorized: Admin ID is required")

    const { data: adminCheck } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', adminId)
      .single()

    if (!adminCheck?.is_admin) throw new Error("CRITICAL: Unauthorized admin action attempt.")

    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId)

    if (error) throw new Error(error.message)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}