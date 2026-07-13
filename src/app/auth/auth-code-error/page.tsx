import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign-in error | Purgatory",
};

export default function AuthCodeErrorPage() {
  return (
    <main className="min-h-[calc(100dvh-3.5rem)] flex items-start justify-center px-4 pt-16 md:pt-20">
      <section className="w-full max-w-sm p-6 border border-gray-500/20 rounded-2xl text-center">
        <h1 className="text-xl font-black mb-2">Sign-in could not be completed</h1>
        <p className="text-sm opacity-60 mb-5">
          The Google sign-in link may have expired or been cancelled. Please
          return home and try again.
        </p>
        <Link
          href="/"
          className="inline-flex h-10 px-5 items-center justify-center bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
        >
          Back to home
        </Link>
      </section>
    </main>
  );
}
