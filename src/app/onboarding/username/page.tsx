import type { Metadata } from "next";
import UsernameForm from "./username-form";

export const metadata: Metadata = {
  title: "Kullanıcı adını seç | Purgatory",
};

type UsernameOnboardingPageProps = {
  searchParams: Promise<{
    next?: string | string[];
  }>;
};

const SAFE_ORIGIN = "https://purgatory.local";

function getSafeNextPath(value: string | string[] | undefined) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/";
  }

  try {
    const destination = new URL(value, SAFE_ORIGIN);

    if (
      destination.origin !== SAFE_ORIGIN ||
      destination.pathname === "/onboarding/username" ||
      destination.pathname === "/onboarding/username/"
    ) {
      return "/";
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return "/";
  }
}

export default async function UsernameOnboardingPage({
  searchParams,
}: UsernameOnboardingPageProps) {
  const { next } = await searchParams;

  return <UsernameForm nextPath={getSafeNextPath(next)} />;
}
