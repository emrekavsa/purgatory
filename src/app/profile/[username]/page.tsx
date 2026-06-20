import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { fetchPollCards } from "@/lib/polls";
import ProfileClient from "@/components/ProfileClient";
import type { Metadata } from "next";
import type { Profile } from "@/types/domain";

type PageProps = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  return {
    title: `${decodedUsername}'s Profile | Purgatory`,
    description: `See polls and opinions from ${decodedUsername} on Purgatory.`,
  };
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const decodedUsername = decodeURIComponent(username);
  
  const supabase = await createClient();

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", decodedUsername)
    .single();

  if (!profileData) {
    return (
      <div className="text-center py-20 opacity-40 font-bold italic">
        User not found.
      </div>
    );
  }

  const initialPolls = await fetchPollCards(supabase, {
    profileUsername: decodedUsername,
    limit: 10,
  });

  return (
    <Suspense fallback={<div>Loading profile...</div>}>
      <ProfileClient
        initialProfile={profileData as Profile}
        initialPolls={initialPolls}
        username={decodedUsername}
      />
    </Suspense>
  );
}
