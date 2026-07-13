import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { OAUTH_NEXT_COOKIE } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function getGoogleAvatarUrl(user: User) {
  const identityData = user.identities?.find(
    (identity) => identity.provider === "google",
  )?.identity_data;
  const candidate = [identityData?.avatar_url, identityData?.picture].find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  if (typeof candidate !== "string") return null;

  try {
    const avatarUrl = new URL(candidate);

    if (
      avatarUrl.protocol !== "https:" ||
      avatarUrl.hostname !== "lh3.googleusercontent.com"
    ) {
      return null;
    }

    return avatarUrl.toString();
  } catch {
    return null;
  }
}

function getSafeRedirectUrl(value: string | null, origin: string) {
  if (
    !value?.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return new URL("/", origin);
  }

  const destination = new URL(value, origin);

  return destination.origin === origin ? destination : new URL("/", origin);
}

function decodeNextPath(value: string | undefined) {
  if (!value) return null;

  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function redirectAndClearNextCookie(destination: URL) {
  const response = NextResponse.redirect(destination);
  response.cookies.set(OAUTH_NEXT_COOKIE, "", {
    path: "/auth/callback",
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const destination = getSafeRedirectUrl(
    decodeNextPath(request.cookies.get(OAUTH_NEXT_COOKIE)?.value),
    requestUrl.origin,
  );

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!userError && user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("username_set, avatar_url")
          .eq("id", user.id)
          .single();

        if (profileError || !profile) {
          return redirectAndClearNextCookie(
            new URL("/auth/auth-code-error", requestUrl.origin),
          );
        }

        const googleAvatarUrl = getGoogleAvatarUrl(user);

        if (googleAvatarUrl && !profile.avatar_url) {
          const avatarUpdate = supabase
            .from("profiles")
            .update({ avatar_url: googleAvatarUrl })
            .eq("id", user.id);

          if (profile.avatar_url === null) {
            await avatarUpdate.is("avatar_url", null);
          } else {
            await avatarUpdate.eq("avatar_url", profile.avatar_url);
          }
        }

        if (profile.username_set === false) {
          const onboardingUrl = new URL(
            "/onboarding/username",
            requestUrl.origin,
          );
          const nextPath = destination.pathname.startsWith(
            "/onboarding/username",
          )
            ? "/"
            : `${destination.pathname}${destination.search}${destination.hash}`;
          onboardingUrl.searchParams.set("next", nextPath);
          return redirectAndClearNextCookie(onboardingUrl);
        }

        return redirectAndClearNextCookie(destination);
      }
    }
  }

  return redirectAndClearNextCookie(
    new URL("/auth/auth-code-error", requestUrl.origin),
  );
}
