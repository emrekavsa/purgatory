import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { fetchPollCard } from "@/lib/polls";
import PollDetailClient from "@/components/PollDetailClient";
import type { Metadata } from "next";
import type { CommentRecord } from "@/types/domain";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const poll = await fetchPollCard(supabase, id);
  if (!poll) return { title: "Poll Not Found" };

  const authorName = poll.profiles?.username || "Anonymous";
  return {
    title: `${poll.title} - ${authorName} | Purgatory`,
    description: String(poll.content || `Vote on this poll and join the discussion on Purgatory!`),
    openGraph: {
      title: `${authorName}'s Poll on Purgatory`,
      description: String(poll.content || `Vote on this poll and join the discussion on Purgatory!`),
      type: "article",
    },
  };
}

export default async function PollDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const poll = await fetchPollCard(supabase, id);

  if (!poll) {
    return (
      <div className="text-center py-20 opacity-40 italic font-bold">
        Poll not found
      </div>
    );
  }

  const { data: initialCommentsData } = await supabase
    .from("comments")
    .select("*, profiles(username, avatar_url)")
    .eq("poll_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const initialComments = (initialCommentsData || []) as CommentRecord[];

  return (
    <Suspense fallback={<div>Loading poll...</div>}>
      <PollDetailClient
        initialPoll={poll}
        initialComments={initialComments}
        pollId={id}
      />
    </Suspense>
  );
}
