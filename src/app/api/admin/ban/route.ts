import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function createServerClient(key: string) {
  return createClient(supabaseUrl ?? "", key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Supabase server configuration is missing." },
      { status: 500 },
    );
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
  }

  const { targetUserId, banned = true } = await request.json();

  if (typeof targetUserId !== "string") {
    return NextResponse.json({ error: "Invalid target user." }, { status: 400 });
  }

  const authClient = createServerClient(supabaseAnonKey);
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const adminClient = createServerClient(supabaseServiceRoleKey);
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("is_admin, isbanned")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.is_admin || profile?.isbanned) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (banned) {
    const cleanupSteps = [
      adminClient.from("comments").delete().eq("user_id", targetUserId),
      adminClient.from("votes").delete().eq("user_id", targetUserId),
      adminClient.from("polls").delete().eq("user_id", targetUserId),
    ];

    for (const step of cleanupSteps) {
      const { error } = await step;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  const { error: updateError } = await adminClient
    .from("profiles")
    .update({ isbanned: banned })
    .eq("id", targetUserId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
