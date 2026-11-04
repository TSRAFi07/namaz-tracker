
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";

const surahs = [
  "Al-Fatihah", "Al-Baqarah", "Aal-Imran", "An-Nisa", "Al-Maidah",
  "Al-Anam", "Al-Araf", "Al-Anfal", "At-Tawbah", "Yunus",
  "Hud", "Yusuf", "Ar-Rad", "Ibrahim", "Al-Hijr",
  "An-Nahl", "Al-Isra", "Al-Kahf", "Maryam", "Ta-Ha",
  "Al-Anbiya", "Al-Hajj", "Al-Muminun", "An-Nur", "Al-Furqan",
  "Ash-Shuara", "An-Naml", "Al-Qasas", "Al-Ankabut", "Ar-Rum",
  "Luqman", "As-Sajdah", "Al-Ahzab", "Saba", "Fatir",
  "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir",
  "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah",
  "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf",
  "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman",
  "Al-Waqiah", "Al-Hadid", "Al-Mujadilah", "Al-Hashr", "Al-Mumtahanah",
  "As-Saff", "Al-Jumuah", "Al-Munafiqun", "At-Taghabun", "At-Talaq",
  "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Maarij",
  "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah",
  "Al-Insan", "Al-Mursalat", "An-Naba", "An-Naziat", "Abasa",
  "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj",
  "At-Tariq", "Al-Ala", "Al-Ghashiyah", "Al-Fajr", "Al-Balad",
  "Ash-Shams", "Al-Layl", "Ad-Duha", "Ash-Sharh", "At-Tin",
  "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat",
  "Al-Qariah", "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil",
  "Quraysh", "Al-Maun", "Al-Kawthar", "Al-Kafirun", "An-Nasr",
  "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

type QuranLog = {
  id: string;
  activity_date: string;
  activity_type: string;
  surah_name: string;
  start_ayah: number;
  end_ayah: number;
  pages: number;
  notes: string | null;
};

export default function QuranPage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [activityType, setActivityType] = useState("Reading");
  const [surahNumber, setSurahNumber] = useState(1);
  const [startAyah, setStartAyah] = useState("1");
  const [endAyah, setEndAyah] = useState("1");
  const [pages, setPages] = useState("0");
  const [date, setDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [notes, setNotes] = useState("");
  const [logs, setLogs] = useState<QuranLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      router.push("/login");
      return;
    }

    await loadLogs();
  }

  async function loadLogs() {
    const { data, error } = await supabase
      .from("quran_logs")
      .select("*")
      .order("activity_date", { ascending: false });

    if (error) {
      setMessage(error.message);
    } else {
      setLogs(data || []);
    }

    setLoading(false);
  }

  async function saveActivity(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (
      !startAyah ||
      !endAyah ||
      Number(startAyah) < 1 ||
      Number(endAyah) < Number(startAyah)
    ) {
      setMessage("Please enter a valid Ayah range.");
      return;
    }

    if (
      activityType === "Reading" &&
      (!pages || Number(pages) < 0)
    ) {
      setMessage("Please enter valid pages.");
      return;
    }

    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      router.push("/login");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("quran_logs").insert({
      user_id: userData.user.id,
      activity_date: date,
      activity_type: activityType,
      surah_number: surahNumber,
      surah_name: surahs[surahNumber - 1],
      start_ayah: Number(startAyah),
      end_ayah: Number(endAyah),
      pages: activityType === "Reading" ? Number(pages) : 0,
      notes: notes.trim() || null,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Activity saved successfully!");
      setStartAyah("1");
      setEndAyah("1");
      setPages("0");
      setNotes("");
      await loadLogs();
    }

    setSaving(false);
  }

  async function deleteLog(id: string) {
    const { error } = await supabase
      .from("quran_logs")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
    } else {
      setLogs((previous) =>
        previous.filter((log) => log.id !== id)
      );
      setMessage("Record deleted.");
    }
  }

  function getActivityName(type: string) {
    if (type === "Reading") {
      return t("Reading", "তিলাওয়াত");
    }

    if (type === "Memorization") {
      return t("Memorization", "মুখস্থ");
    }

    return type;
  }

  function getMessageText(value: string) {
    if (value === "Please enter a valid Ayah range.") {
      return t(
        "Please enter a valid Ayah range.",
        "সঠিক আয়াতের সীমা লিখুন।"
      );
    }

    if (value === "Please enter valid pages.") {
      return t(
        "Please enter valid pages.",
        "সঠিক পৃষ্ঠার সংখ্যা লিখুন।"
      );
    }

    if (value === "Activity saved successfully!") {
      return t(
        "Activity saved successfully!",
        "কার্যক্রম সফলভাবে সংরক্ষণ হয়েছে!"
      );
    }

    if (value === "Record deleted.") {
      return t(
        "Record deleted.",
        "রেকর্ড মুছে ফেলা হয়েছে।"
      );
    }

    return value;
  }

  const readingLogs = logs.filter(
    (log) => log.activity_type === "Reading"
  );

  const memorizationLogs = logs.filter(
    (log) => log.activity_type === "Memorization"
  );

  const totalPages = readingLogs.reduce(
    (sum, log) => sum + Number(log.pages || 0),
    0
  );

  function formatDate(dateValue: string) {
    return new Date(dateValue + "T00:00:00").toLocaleDateString(
      language === "bn" ? "bn-BD" : "en-US",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7f1] p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">

        <Navigation />

        {/* Welcome Banner */}
        <section className="relative overflow-hidden bg-gradient-to-r from-green-900 via-green-800 to-emerald-700 rounded-3xl p-6 sm:p-9 text-white shadow-lg">
          <div className="absolute -right-12 -top-16 w-56 h-56 rounded-full bg-white/5" />
          <div className="absolute right-20 -bottom-24 w-64 h-64 rounded-full bg-white/5" />

          <div className="relative z-10">
            <p className="text-green-200 text-sm font-semibold">
              {t("YOUR QURAN JOURNEY", "আপনার কুরআনের যাত্রা")}
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold mt-3">
              {t("Quran Tracker", "কুরআন ট্র্যাকার")}
            </h1>

            <p className="text-green-100 mt-3 max-w-xl">
              {t(
                "Stay connected with the Holy Quran. Track your reading and memorization progress every day.",
                "পবিত্র কুরআনের সঙ্গে যুক্ত থাকুন। প্রতিদিনের তিলাওয়াত ও মুখস্থের অগ্রগতি সংরক্ষণ করুন।"
              )}
            </p>

            <div className="mt-6 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-sm">
              <span>📖</span>
              <span>
                {t(
                  "Read • Reflect • Memorize",
                  "পড়ুন • চিন্তা করুন • মুখস্থ করুন"
                )}
              </span>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-7">

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">
              📖
            </div>
            <p className="text-gray-500 text-sm mt-4">
              {t("Reading Sessions", "তিলাওয়াতের সেশন")}
            </p>
            <h2 className="text-3xl font-bold text-green-800 mt-1">
              {readingLogs.length}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">
              📚
            </div>
            <p className="text-gray-500 text-sm mt-4">
              {t("Pages Read", "পড়া পৃষ্ঠা")}
            </p>
            <h2 className="text-3xl font-bold text-blue-800 mt-1">
              {totalPages}
            </h2>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl">
              🧠
            </div>
            <p className="text-gray-500 text-sm mt-4">
              {t("Memorization Sessions", "মুখস্থের সেশন")}
            </p>
            <h2 className="text-3xl font-bold text-emerald-800 mt-1">
              {memorizationLogs.length}
            </h2>
          </div>

        </section>

        {/* Activity Form */}
        <section className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-green-50 mt-7">

          <div className="mb-6">
            <p className="text-sm font-semibold text-green-700">
              {t("RECORD YOUR PROGRESS", "আপনার অগ্রগতি সংরক্ষণ করুন")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">
              {t("Add Quran Activity", "কুরআন কার্যক্রম যোগ করুন")}
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              {t(
                "Record the verses you have read or memorized.",
                "আপনি যে আয়াতগুলো পড়েছেন বা মুখস্থ করেছেন তা সংরক্ষণ করুন।"
              )}
            </p>
          </div>

          {/* Activity Type */}
          <div className="grid grid-cols-2 gap-3 mb-7">
            <button
              type="button"
              onClick={() => setActivityType("Reading")}
              className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold transition ${
                activityType === "Reading"
                  ? "bg-green-800 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-green-50"
              }`}
            >
              <span>📖</span>
              {t("Reading", "তিলাওয়াত")}
            </button>

            <button
              type="button"
              onClick={() => setActivityType("Memorization")}
              className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold transition ${
                activityType === "Memorization"
                  ? "bg-green-800 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-green-50"
              }`}
            >
              <span>🧠</span>
              {t("Memorization", "মুখস্থ")}
            </button>
          </div>

          <form onSubmit={saveActivity} className="space-y-5">

            {/* Surah */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("Select Surah", "সূরা নির্বাচন করুন")}
              </label>

              <select
                value={surahNumber}
                onChange={(e) =>
                  setSurahNumber(Number(e.target.value))
                }
                className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3.5 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                {surahs.map((surah, index) => (
                  <option key={surah} value={index + 1}>
                    {index + 1}. {surah}
                  </option>
                ))}
              </select>
            </div>

            {/* Ayah Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("Starting Ayah", "শুরুর আয়াত")}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={startAyah}
                  onChange={(e) => setStartAyah(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3.5 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("Ending Ayah", "শেষ আয়াত")}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={endAyah}
                  onChange={(e) => setEndAyah(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3.5 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>

            </div>

            {/* Pages */}
            {activityType === "Reading" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("Pages Read", "পড়া পৃষ্ঠা")}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3.5 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("Activity Date", "কার্যক্রমের তারিখ")}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3.5 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("Notes (Optional)", "নোট (ঐচ্ছিক)")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t(
                  "Write a short note about your progress...",
                  "আপনার অগ্রগতি সম্পর্কে সংক্ষিপ্ত কিছু লিখুন..."
                )}
                rows={3}
                className="w-full border border-gray-200 bg-gray-50 rounded-xl p-3.5 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-green-800 hover:bg-green-900 text-white font-semibold py-4 rounded-xl transition shadow-sm disabled:opacity-50"
            >
              {saving
                ? t("Saving Activity...", "কার্যক্রম সংরক্ষণ হচ্ছে...")
                : `＋ ${t("Save Activity", "সংরক্ষণ করুন")}`}
            </button>

          </form>

          {message && (
            <div className={`mt-5 p-4 rounded-xl text-center text-sm font-medium ${
              message.toLowerCase().includes("error") ||
              message.toLowerCase().includes("failed") ||
              message.includes("Please")
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}>
              {getMessageText(message)}
            </div>
          )}

        </section>

        {/* Previous Records */}
        <section className="mt-8">

          <div className="mb-5">
            <p className="text-sm font-semibold text-green-700">
              {t("YOUR ACTIVITY", "আপনার কার্যক্রম")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">
              {t("Previous Records", "পূর্ববর্তী রেকর্ড")}
            </h2>
          </div>

          <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-green-50">

            {loading ? (
              <div className="py-10 text-center">
                <div className="w-9 h-9 border-4 border-green-200 border-t-green-700 rounded-full animate-spin mx-auto" />
                <p className="text-gray-500 mt-4">
                  {t("Loading your records...", "আপনার রেকর্ড লোড হচ্ছে...")}
                </p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📖</div>
                <h3 className="font-bold text-gray-800 text-lg">
                  {t("No Records Yet", "এখনো কোনো রেকর্ড নেই")}
                </h3>
                <p className="text-gray-500 text-sm mt-2">
                  {t(
                    "Your Quran activities will appear here.",
                    "আপনার কুরআন কার্যক্রম এখানে দেখা যাবে।"
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border border-green-100 rounded-2xl p-5 hover:border-green-300 hover:shadow-sm transition"
                  >
                    <div className="flex flex-wrap justify-between gap-4">

                      <div className="flex gap-4 flex-1 min-w-0">

                        <div className="w-12 h-12 shrink-0 rounded-xl bg-green-50 flex items-center justify-center text-xl">
                          {log.activity_type === "Reading" ? "📖" : "🧠"}
                        </div>

                        <div className="min-w-0">
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            log.activity_type === "Reading"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {getActivityName(log.activity_type)}
                          </span>

                          <h3 className="font-bold text-gray-900 mt-3">
                            {log.surah_name}
                          </h3>

                          <p className="text-sm text-gray-600 mt-1">
                            {t("Ayah", "আয়াত")} {log.start_ayah} – {log.end_ayah}
                          </p>

                          {log.activity_type === "Reading" && (
                            <p className="text-sm text-gray-600 mt-1">
                              {t("Pages", "পৃষ্ঠা")}: {log.pages}
                            </p>
                          )}

                          <p className="text-xs text-gray-500 mt-2">
                            📅 {formatDate(log.activity_date)}
                          </p>

                          {log.notes && (
                            <p className="text-sm text-gray-600 mt-3 bg-gray-50 p-3 rounded-xl">
                              {log.notes}
                            </p>
                          )}
                        </div>

                      </div>

                      <button
                        type="button"
                        onClick={() => deleteLog(log.id)}
                        className="self-start text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-semibold transition"
                      >
                        {t("Delete", "মুছে ফেলুন")}
                      </button>

                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </section>

        <footer className="text-center mt-9 pb-5">
          <p className="text-gray-500 text-sm">
            {t(
              "The best deeds are those done consistently.",
              "আল্লাহর কাছে সবচেয়ে প্রিয় আমল হলো যা নিয়মিত করা হয়।"
            )}
          </p>
        </footer>

      </div>
    </main>
  );
}
