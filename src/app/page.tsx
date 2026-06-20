import { Suspense } from "react";
import PollList from "@/components/PollList";
import { fetchPollCards } from "@/lib/polls";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const category =
    typeof resolvedParams.c === "string" ? resolvedParams.c : undefined;

  const supabase = await createClient();
  const initialPolls = await fetchPollCards(supabase, {
    category,
    limit: 10,
    offset: 0,
  });

  return (
    <Suspense fallback={null}>
      <PollList initialPolls={initialPolls} initialCategory={category} />
    </Suspense>
  );
}
