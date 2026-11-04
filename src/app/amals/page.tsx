
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/context/LanguageContext";

const amals = [
  {
    name: "Fajr Prayer",
    subtitle: "Begin your day with prayer",
    icon: "🌅",
    bnName: "ফজরের নামাজ",
    bnSubtitle: "নামাজের মাধ্যমে দিন শুরু করুন",
  },
  {
    name: "Morning and Evening Dhikr",
    subtitle: "Remember Allah throughout the day",
    icon: "📿",
    bnName: "সকাল ও সন্ধ্যার যিকির",
    bnSubtitle: "সারাদিন আল্লাহকে স্মরণ করুন",
  },
  {
    name: "Recitation of the Quran",
    subtitle: "Spend time with the Holy Quran",
    icon: "📖",
    bnName: "পবিত্র কুরআন তিলাওয়াত",
    bnSubtitle: "পবিত্র কুরআনের সাথে সময় কাটান",
  },
  {
    name: "Ayatul Kursi",
    subtitle: "Recite Ayatul Kursi",
    icon: "✨",
    bnName: "আয়াতুল কুরসি",
    bnSubtitle: "আয়াতুল কুরসি পাঠ করুন",
  },
  {
    name: "Istighfar",
    subtitle: "Seek forgiveness from Allah",
    icon: "🤲",
    bnName: "ইস্তিগফার",
    bnSubtitle: "আল্লাহর কাছে ক্ষমা প্রার্থনা করুন",
  },
  {
    name: "Durood Sharif",
    subtitle: "Send blessings upon the Prophet ﷺ",
    icon: "💚",
    bnName: "দরুদ শরিফ",
    bnSubtitle: "নবী ﷺ-এর প্রতি দরুদ পাঠ করুন",
  },
];

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getFormattedDate(language: "en" | "bn") {
  return new Date().toLocaleDateString(
    language === "bn" ? "bn-BD" : "en-US",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

export default function AmalsPage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [completed, setCompleted] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    async function loadAmals() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data, error } = await supabase
          .from("daily_amals")
          .select("amal_name, completed")
          .eq("user_id", user.id)
          .eq("amal_date", getToday());

        if (error) throw error;

        setCompleted(
          data
            .filter((item) => item.completed)
            .map((item) => item.amal_name)
        );
      } catch (error) {
        console.error("Loading Error:", error);
        setMessage(
          error instanceof Error ? error.message : "Loading failed"
        );
      } finally {
        setLoading(false);
      }
    }

    loadAmals();
  }, [router]);

  async function toggleAmal(amal: string, checked: boolean) {
    if (saving) return;

    const previous = completed;

    setCompleted(
      checked
        ? [...previous, amal]
        : previous.filter((item) => item !== amal)
    );

    setSaving(amal);
    setMessage("saving");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { error } = await supabase
        .from("daily_amals")
        .upsert(
          {
            user_id: user.id,
            amal_date: getToday(),
            amal_name: amal,
            completed: checked,
          },
          {
            onConflict: "user_id,amal_date,amal_name",
          }
        );

      if (error) throw error;

      setMessage("saved");
    } catch (error) {
      console.error("Amal Save Error:", error);
      setCompleted(previous);

      setMessage(
        error instanceof Error ? error.message : "Saving failed"
      );
    } finally {
      setSaving(null);
    }
  }

  const percentage = Math.round(
    (completed.length / amals.length) * 100
  );

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f5f7f1]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-green-200 border-t-green-700 rounded-full animate-spin mx-auto" />
          <p className="text-green-800 font-semibold mt-4">
            {t("Loading your daily amals...", "আপনার দৈনিক আমলগুলো লোড হচ্ছে...")}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7f1] p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">

        <Navigation />

        {/* Header */}
        <section className="relative overflow-hidden bg-gradient-to-r from-green-900 via-green-800 to-emerald-700 rounded-3xl p-6 sm:p-9 text-white shadow-lg">
          <div className="absolute -right-12 -top-16 w-56 h-56 rounded-full bg-white/5" />
          <div className="absolute right-20 -bottom-24 w-64 h-64 rounded-full bg-white/5" />

          <div className="relative z-10">
            <p className="text-green-200 text-sm font-medium">
              {t("YOUR DAILY WORSHIP", "আপনার দৈনিক ইবাদত")}
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold mt-3">
              {t("Daily Amal Tracker", "দৈনিক আমল ট্র্যাকার")}
            </h1>

            <p className="text-green-100 mt-3 max-w-xl">
              {t(
                "Small consistent deeds can bring great blessings. Keep building your daily habits.",
                "নিয়মিত ছোট ছোট আমলও অনেক বরকত বয়ে আনতে পারে। প্রতিদিন ভালো অভ্যাস গড়ে তুলুন।"
              )}
            </p>

            <div className="mt-6 flex items-center gap-2 text-sm text-green-100">
              <span>📅</span>
              <span>{getFormattedDate(language)}</span>
            </div>
          </div>
        </section>

        {/* Progress */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">

          <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-green-50">
            <div className="flex flex-col sm:flex-row items-center gap-7">

              <div className="relative w-36 h-36 shrink-0">
                <svg
                  viewBox="0 0 120 120"
                  className="w-full h-full -rotate-90"
                >
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke="#e5eee5"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    fill="none"
                    stroke="#15803d"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(percentage / 100) * 301.6} 301.6`}
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-green-900">
                    {percentage}%
                  </span>
                  <span className="text-xs text-gray-500">
                    {t("Completed", "সম্পন্ন")}
                  </span>
                </div>
              </div>

              <div className="text-center sm:text-left flex-1">
                <p className="text-sm text-gray-500 font-medium">
                  {t("TODAY'S PROGRESS", "আজকের অগ্রগতি")}
                </p>

                <h2 className="text-2xl font-bold text-gray-900 mt-2">
                  {completed.length} {t("of", "টি সম্পন্ন / মোট")} {amals.length} {t("Amals", "টি আমল")}
                </h2>

                <p className="text-gray-500 mt-2 text-sm">
                  {completed.length === amals.length
                    ? t(
                        "Alhamdulillah! All daily amals completed.",
                        "আলহামদুলিল্লাহ! আজকের সব আমল সম্পন্ন হয়েছে।"
                      )
                    : t(
                        "Keep going! Complete your remaining daily amals.",
                        "চালিয়ে যান! বাকি আমলগুলোও সম্পন্ন করুন।"
                      )}
                </p>

                <div className="w-full bg-gray-100 h-2.5 rounded-full mt-5 overflow-hidden">
                  <div
                    className="bg-green-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-green-50 flex flex-col justify-center">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-2xl">
              🌿
            </div>

            <p className="text-gray-500 text-sm mt-4">
              {t("Remaining Amals", "বাকি আমল")}
            </p>

            <h2 className="text-4xl font-bold text-green-900 mt-1">
              {amals.length - completed.length}
            </h2>

            <p className="text-gray-500 text-sm mt-2">
              {t(
                "Keep your consistency alive.",
                "নিয়মিত আমল করার অভ্যাস ধরে রাখুন।"
              )}
            </p>
          </div>
        </section>

        {/* Amal List */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm text-green-700 font-semibold">
                {t("DAILY CHECKLIST", "দৈনিক আমলের তালিকা")}
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                {t("Your Good Deeds", "আপনার ভালো কাজগুলো")}
              </h2>
            </div>

            <span className="text-sm text-gray-500 bg-white px-3 py-2 rounded-xl border border-green-100">
              {completed.length}/{amals.length} {t("Done", "সম্পন্ন")}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {amals.map((amal) => {
              const isCompleted = completed.includes(amal.name);

              return (
                <label
                  key={amal.name}
                  className={`group flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                    isCompleted
                      ? "bg-green-50 border-green-300 shadow-sm"
                      : "bg-white border-gray-100 hover:border-green-300 hover:shadow-md"
                  }`}
                >
                  <div className="w-14 h-14 shrink-0 rounded-2xl bg-green-50 flex items-center justify-center text-2xl group-hover:scale-105 transition">
                    {amal.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-bold ${
                        isCompleted ? "text-green-800" : "text-gray-800"
                      }`}
                    >
                      {t(amal.name, amal.bnName)}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      {t(amal.subtitle, amal.bnSubtitle)}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      disabled={saving !== null}
                      onChange={(e) =>
                        toggleAmal(amal.name, e.target.checked)
                      }
                      className="w-6 h-6 accent-green-700 cursor-pointer disabled:cursor-wait"
                    />
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        {/* Save Message */}
        {message && (
          <div
            className={`mt-6 p-4 rounded-2xl text-center text-sm font-medium ${
              message === "saving"
                ? "bg-yellow-50 text-yellow-700"
                : message === "saved"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message === "saving"
              ? t("Saving your progress...", "আপনার অগ্রগতি সংরক্ষণ হচ্ছে...")
              : message === "saved"
              ? t("Progress saved successfully!", "অগ্রগতি সফলভাবে সংরক্ষিত হয়েছে!")
              : message}
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-10 pb-5">
          <p className="text-gray-500 text-sm">
            {t(
              "Make every day a step closer to Allah.",
              "প্রতিটি দিন হোক আল্লাহর আরও নিকটবর্তী হওয়ার একটি পদক্ষেপ।"
            )}
          </p>

          <button
            onClick={() => router.push("/")}
            className="mt-4 bg-green-800 hover:bg-green-900 text-white font-semibold px-6 py-3 rounded-xl transition shadow-sm"
          >
            {t("← Back to Dashboard", "← ড্যাশবোর্ডে ফিরে যান")}
          </button>
        </footer>

      </div>
    </main>
  );
}
