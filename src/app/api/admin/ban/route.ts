import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LONG_BAN_DURATION = "876000h";

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

  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  if (!token) {
    return NextResponse.json({ error: "Missing auth token." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { targetUserId, banned = true } = body as {
    targetUserId?: unknown;
    banned?: unknown;
  };

  if (
    typeof targetUserId !== "string" ||
    !UUID_PATTERN.test(targetUserId) ||
    typeof banned !== "boolean"
  ) {
    return NextResponse.json(
      { error: "Invalid target user." },
      { status: 400 },
    );
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

  if (targetUserId === user.id) {
    return NextResponse.json(
      { error: "You cannot ban your own account." },
      { status: 400 },
    );
  }

  const { data: targetProfile, error: targetProfileError } = await adminClient
    .from("profiles")
    .select("id, is_admin")
    .eq("id", targetUserId)
    .single();

  if (targetProfileError || !targetProfile) {
    return NextResponse.json({ error: "Target user not found." }, { status: 404 });
  }

  if (targetProfile.is_admin) {
    return NextResponse.json(
      { error: "Admin accounts cannot be banned here." },
      { status: 403 },
    );
  }

  const { error: profileUpdateError } = await adminClient
    .from("profiles")
    .update({ isbanned: banned })
    .eq("id", targetUserId);

  if (profileUpdateError) {
    return NextResponse.json(
      { error: "Could not update the user ban." },
      { status: 500 },
    );
  }

  const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
    targetUserId,
    { ban_duration: banned ? LONG_BAN_DURATION : "none" },
  );

  if (authUpdateError) {
    await adminClient
      .from("profiles")
      .update({ isbanned: !banned })
      .eq("id", targetUserId);

    return NextResponse.json(
      { error: "Could not update the authentication ban." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
