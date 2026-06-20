"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/context/AppContext";

const CATEGORIES = ["General", "Tech", "Sports", "Gaming", "Movies & TV Shows"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_ACCEPT = ALLOWED_IMAGE_TYPES.join(",");

type PollOptionDraft = {
  content: string;
  image: File | null;
  preview: string | null;
};

const REQUEST_TIMEOUT_MS = 20_000;

async function withTimeout<T>(
  request: PromiseLike<T>,
  message: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(message)),
      REQUEST_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([request, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export default function CreatePoll() {
  const supabase = useMemo(() => createClient(), []);
  const { user, isDark, loading: authLoading, requireLogin } = useApp();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [loading, setLoading] = useState(false);

  const [options, setOptions] = useState<PollOptionDraft[]>([
    { content: "", image: null, preview: null },
    { content: "", image: null, preview: null },
  ]);

  const requireAuthenticatedUser = useCallback(() => {
    if (!authLoading && !user) requireLogin();
  }, [authLoading, requireLogin, user]);

  useEffect(() => {
    requireAuthenticatedUser();
  }, [requireAuthenticatedUser]);

  useEffect(() => {
    const handleResume = () => {
      setLoading(false);
      void supabase.auth.refreshSession().catch(() => undefined);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") handleResume();
    };

    window.addEventListener("pageshow", handleResume);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handleResume);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [supabase]);

  const handleFileChange = (
    index: number,
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        alert("Please upload a JPG, PNG, or WebP image.");
        e.target.value = "";
        return;
      }

      const newOptions = [...options];
      if (newOptions[index].preview)
        URL.revokeObjectURL(newOptions[index].preview);
      newOptions[index].image = file;
      newOptions[index].preview = URL.createObjectURL(file);
      setOptions(newOptions);
    }
    e.target.value = "";
  };

  const removeOptionImage = (index: number) => {
    const newOptions = [...options];
    if (newOptions[index].preview)
      URL.revokeObjectURL(newOptions[index].preview);
    newOptions[index] = { ...newOptions[index], image: null, preview: null };
    setOptions(newOptions);
  };

  const addOption = () =>
    options.length < 4 &&
    setOptions([...options, { content: "", image: null, preview: null }]);

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    if (!user) return requireLogin();

    const imagesCount = options.filter((opt) => opt.image !== null).length;
    if (imagesCount > 0 && imagesCount < options.length) {
      alert("Please either add images to all options or none of them.");
      return;
    }

    let createdPollId: string | null = null;
    const uploadedFilePaths: string[] = [];

    setLoading(true);
    try {
      const optionsData = await Promise.all(
        options.map(async (opt, i) => {
          let imageUrl = null;
          if (opt.image) {
            const folderName = `${user.id}-${Date.now()}`;
            const fileName = `${folderName}/${i}.jpg`;
            const { error: uploadErr } = await withTimeout(
              supabase.storage.from("poll-images").upload(fileName, opt.image),
              "Image upload timed out. Please try again.",
            );

            if (uploadErr) throw uploadErr;
            uploadedFilePaths.push(fileName);

            const { data } = supabase.storage
              .from("poll-images")
              .getPublicUrl(fileName);
            imageUrl = data.publicUrl;
          }

          return { content: opt.content, image_url: imageUrl };
        }),
      );

      const { data: poll, error: pollErr } = await withTimeout(
        supabase
          .from("polls")
          .insert([{ title, category, user_id: user.id }])
          .select("id")
          .single(),
        "Poll creation timed out. Please try again.",
      );

      if (pollErr) throw pollErr;
      createdPollId = poll.id;

      const { error: optionsErr } = await withTimeout(
        supabase.from("poll_options").insert(
          optionsData.map((opt) => ({
            poll_id: poll.id,
            option_type: opt.image_url ? "image" : "text",
            content: opt.content,
            image_url: opt.image_url,
          })),
        ),
        "Poll options creation timed out. Please try again.",
      );

      if (optionsErr) throw optionsErr;

      router.push("/");
    } catch (err) {
      if (createdPollId) {
        await withTimeout(
          supabase.from("polls").delete().eq("id", createdPollId),
          "Poll cleanup timed out.",
        ).catch(() => undefined);
      }

      if (uploadedFilePaths.length > 0) {
        await withTimeout(
          supabase.storage.from("poll-images").remove(uploadedFilePaths),
          "Image cleanup timed out.",
        ).catch(() => undefined);
      }

      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 mt-10">
      <form
        onSubmit={handleSubmit}
        className={`p-6 border rounded-[32px] shadow-xl ${isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-gray-100 text-black"}`}
      >
        <input
          required
          placeholder="The Question?"
          className={`w-full p-4 mb-4 rounded-2xl border outline-none font-bold ${isDark ? "bg-zinc-800 border-zinc-700 text-white" : "bg-gray-50 border-gray-200 text-black"}`}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="mb-6 px-1">
          <label className="text-[10px] font-black uppercase opacity-40 mb-2 block tracking-widest ml-1">
            📂 Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`w-full p-3.5 rounded-2xl border outline-none font-bold cursor-pointer transition-all appearance-none ${
              isDark
                ? "bg-zinc-800 border-zinc-700 text-white hover:border-zinc-500"
                : "bg-gray-50 border-gray-200 text-black hover:border-gray-300"
            }`}
          >
            {CATEGORIES.map((cat) => (
              <option
                key={cat}
                value={cat}
                className={isDark ? "bg-zinc-900" : "bg-white"}
              >
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <label className="text-[10px] font-black uppercase opacity-40 px-1 tracking-widest">
            Options
          </label>
          {options.map((opt, i) => (
            <div
              key={i}
              className={`p-3 sm:p-4 border rounded-2xl flex flex-col gap-3 ${isDark ? "border-zinc-800 bg-zinc-800/30" : "border-gray-200 bg-gray-50"}`}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <input
                  required
                  placeholder={`Option ${i + 1}`}
                  className="min-w-0 flex-1 bg-transparent outline-none font-bold text-sm sm:text-base"
                  value={opt.content}
                  onChange={(e) => {
                    const n = [...options];
                    n[i].content = e.target.value;
                    setOptions(n);
                  }}
                />

                <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="h-9 w-9 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center"
                    >
                      ✕
                    </button>
                  )}
                  <label className="h-9 px-3 sm:px-4 bg-blue-600 text-white rounded-xl cursor-pointer text-[10px] font-black uppercase hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center whitespace-nowrap">
                    Image
                    <input
                      type="file"
                      className="hidden"
                      accept={IMAGE_ACCEPT}
                      onChange={(e) => handleFileChange(i, e)}
                    />
                  </label>
                </div>
              </div>

              {opt.preview && (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/10 bg-black">
                  <img
                    src={opt.preview}
                    className="w-full h-full object-contain p-2"
                    alt=""
                  />
                  <button
                    type="button"
                    onClick={() => removeOptionImage(i)}
                    className="absolute right-2 top-2 rounded-full bg-black/70 px-3 py-1 text-[10px] font-black uppercase text-white backdrop-blur hover:bg-black"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}

          {options.length < 4 && (
            <button
              type="button"
              onClick={addOption}
              className="py-3 border-2 border-dashed border-zinc-500/20 rounded-xl text-xs font-bold opacity-50 hover:opacity-100 transition-opacity"
            >
              + Add Option
            </button>
          )}
        </div>

        <button
          disabled={loading}
          className="w-full p-4 bg-blue-600 text-white rounded-2xl font-black uppercase shadow-lg disabled:opacity-50 hover:bg-blue-700 transition-all transform active:scale-[0.98]"
        >
          {loading ? "Posting..." : "Share Poll"}
        </button>
      </form>
    </div>
  );
}
