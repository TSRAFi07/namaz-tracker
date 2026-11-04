
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/context/LanguageContext";

type PrayerLog = {
  prayer_date: string;
  prayer_name: string;
  status: string;
};

type AmalLog = {
  amal_date: string;
  completed: boolean;
};

function getMonthString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function HistoryPage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [month, setMonth] = useState(getMonthString(new Date()));
  const [logs, setLogs] = useState<Record<string, PrayerLog[]>>({});
  const [amalLogs, setAmalLogs] = useState<AmalLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setMessage("");

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

        const [year, monthNumber] = month.split("-").map(Number);

        const startDate = `${month}-01`;
        const lastDay = new Date(year, monthNumber, 0).getDate();
        const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

        const [prayerResult, amalResult] = await Promise.all([
          supabase
            .from("prayer_logs")
            .select("prayer_date, prayer_name, status")
            .eq("user_id", user.id)
            .gte("prayer_date", startDate)
            .lte("prayer_date", endDate),

          supabase
            .from("daily_amals")
            .select("amal_date, completed")
            .eq("user_id", user.id)
            .gte("amal_date", startDate)
            .lte("amal_date", endDate),
        ]);

        if (prayerResult.error) throw prayerResult.error;
        if (amalResult.error) throw amalResult.error;

        const grouped: Record<string, PrayerLog[]> = {};

        (prayerResult.data || []).forEach((item) => {
          if (!grouped[item.prayer_date]) {
            grouped[item.prayer_date] = [];
          }

          grouped[item.prayer_date].push(item);
        });

        setLogs(grouped);
        setAmalLogs(amalResult.data || []);
      } catch (error) {
        console.error("History Error:", error);
        setMessage(
          error instanceof Error
            ? error.message
            : t("Could not load history", "হিস্টোরি লোড করা যায়নি")
        );
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [month, router, t]);

  function changeMonth(amount: number) {
    const [year, monthNumber] = month.split("-").map(Number);
    const newDate = new Date(year, monthNumber - 1 + amount, 1);
    setMonth(getMonthString(newDate));
  }

  const [year, monthNumber] = month.split("-").map(Number);

  const firstDay = new Date(year, monthNumber - 1, 1).getDay();
  const totalDays = new Date(year, monthNumber, 0).getDate();

  const currentMonth = getMonthString(new Date());

  const today =
    currentMonth === month
      ? new Date().getDate()
      : month < currentMonth
        ? totalDays
        : 0;

  const prayerLogs = Object.values(logs).flat();

  const jamaatCount = prayerLogs.filter(
    (log) => log.status === "Jamaat"
  ).length;

  const aloneCount = prayerLogs.filter(
    (log) => log.status === "Alone"
  ).length;

  const missedCount = prayerLogs.filter(
    (log) => log.status === "Missed"
  ).length;

  const completedCount = jamaatCount + aloneCount;
  const totalExpected = today * 5;

  const prayerPercentage =
    totalExpected > 0
      ? Math.round((completedCount / totalExpected) * 100)
      : 0;

  const completedAmals = amalLogs.filter(
    (amal) => amal.completed
  ).length;

  const totalExpectedAmals = today * 6;

  const amalPercentage =
    totalExpectedAmals > 0
      ? Math.round((completedAmals / totalExpectedAmals) * 100)
      : 0;

  const calendarDays = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const monthName = new Date(year, monthNumber - 1).toLocaleString(
    language === "bn" ? "bn-BD" : "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );

  const weekDays =
    language === "bn"
      ? ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const formatNumber = (number: number) =>
    number.toLocaleString(language === "bn" ? "bn-BD" : "en-US");

  return (
    <main className="min-h-screen bg-[#f5f7f1] p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">

        <Navigation />

        {/* Header */}
        <section className="relative overflow-hidden bg-gradient-to-r from-green-900 via-green-800 to-emerald-700 rounded-3xl p-6 sm:p-9 text-white shadow-lg">
          <div className="absolute -right-12 -top-16 w-56 h-56 rounded-full bg-white/5" />
          <div className="absolute right-20 -bottom-24 w-64 h-64 rounded-full bg-white/5" />

          <div className="relative z-10">
            <p className="text-green-200 text-sm font-semibold">
              {t("YOUR WORSHIP JOURNEY", "আপনার ইবাদতের যাত্রা")}
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold mt-3">
              {t("Prayer History", "নামাজের ইতিহাস")}
            </h1>

            <p className="text-green-100 mt-3 max-w-xl">
              {t(
                "Look back at your progress, celebrate your consistency, and keep improving every day.",
                "আপনার অগ্রগতি ফিরে দেখুন, নিয়মিত আমলের ধারাবাহিকতা ধরে রাখুন এবং প্রতিদিন নিজেকে আরও উন্নত করুন।"
              )}
            </p>

            <div className="flex items-center gap-2 mt-6 text-sm text-green-100">
              <span>📅</span>
              <span>{monthName}</span>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="mt-7">
          <div className="mb-5">
            <p className="text-sm font-semibold text-green-700">
              {t("MONTHLY OVERVIEW", "মাসিক সারসংক্ষেপ")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">
              {t("Your Prayer Statistics", "আপনার নামাজের পরিসংখ্যান")}
            </h2>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-8 text-center text-green-800">
              {t("Loading statistics...", "পরিসংখ্যান লোড হচ্ছে...")}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-green-100">
                  <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center text-xl">
                    🕌
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    {t("Jamaat", "জামাতে")}
                  </p>
                  <h3 className="text-3xl font-bold text-green-700 mt-1">
                    {formatNumber(jamaatCount)}
                  </h3>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100">
                  <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-xl">
                    🤲
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    {t("Alone", "একা")}
                  </p>
                  <h3 className="text-3xl font-bold text-blue-700 mt-1">
                    {formatNumber(aloneCount)}
                  </h3>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
                  <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center text-xl">
                    ⏳
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    {t("Missed", "ছুটে গেছে")}
                  </p>
                  <h3 className="text-3xl font-bold text-red-600 mt-1">
                    {formatNumber(missedCount)}
                  </h3>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100">
                  <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-xl">
                    ✓
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    {t("Completed", "সম্পন্ন")}
                  </p>
                  <h3 className="text-3xl font-bold text-emerald-700 mt-1">
                    {formatNumber(completedCount)}
                  </h3>
                </div>

              </div>

              {/* Progress Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-500 text-sm">
                        {t("Prayer Completion", "নামাজ সম্পন্নের হার")}
                      </p>
                      <h3 className="text-3xl font-bold text-green-800 mt-1">
                        {formatNumber(prayerPercentage)}%
                      </h3>
                    </div>

                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">
                      🕌
                    </div>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-3 mt-5 overflow-hidden">
                    <div
                      className="bg-green-600 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(prayerPercentage, 100)}%`,
                      }}
                    />
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    {formatNumber(completedCount)} {t("completed out of", "টি সম্পন্ন, মোট")} {formatNumber(totalExpected)} {t("expected prayers.", "টি প্রত্যাশিত নামাজের মধ্যে।")}
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-500 text-sm">
                        {t("Daily Amal Completion", "দৈনিক আমল সম্পন্নের হার")}
                      </p>
                      <h3 className="text-3xl font-bold text-emerald-800 mt-1">
                        {formatNumber(amalPercentage)}%
                      </h3>
                    </div>

                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl">
                      🌿
                    </div>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-3 mt-5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(amalPercentage, 100)}%`,
                      }}
                    />
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    {formatNumber(completedAmals)} {t("completed out of", "টি সম্পন্ন, মোট")} {formatNumber(totalExpectedAmals)} {t("expected amals.", "টি প্রত্যাশিত আমলের মধ্যে।")}
                  </p>
                </div>

              </div>
            </>
          )}
        </section>

        {/* Calendar */}
        <section className="bg-white rounded-3xl p-4 sm:p-7 shadow-sm border border-green-50 mt-7">

          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-sm font-semibold text-green-700">
                {t("DAILY RECORDS", "দৈনিক রেকর্ড")}
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">
                {t("Prayer Calendar", "নামাজের ক্যালেন্ডার")}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => changeMonth(-1)}
                className="w-10 h-10 rounded-xl bg-green-50 text-green-800 hover:bg-green-100 font-bold transition"
                aria-label={t("Previous month", "আগের মাস")}
              >
                ←
              </button>

              <span className="font-bold text-gray-800 min-w-28 text-center">
                {monthName}
              </span>

              <button
                onClick={() => changeMonth(1)}
                disabled={month >= currentMonth}
                className="w-10 h-10 rounded-xl bg-green-50 text-green-800 hover:bg-green-100 font-bold transition disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label={t("Next month", "পরের মাস")}
              >
                →
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-green-800">
              {t("Loading calendar...", "ক্যালেন্ডার লোড হচ্ছে...")}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-3 text-center">

                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-xs sm:text-sm font-bold text-gray-500 py-2"
                  >
                    {day}
                  </div>
                ))}

                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} />;
                  }

                  const dateKey = `${month}-${String(day).padStart(2, "0")}`;
                  const dayLogs = logs[dateKey] || [];

                  const completed = dayLogs.filter(
                    (log) =>
                      log.status === "Jamaat" || log.status === "Alone"
                  ).length;

                  const missed = dayLogs.filter(
                    (log) => log.status === "Missed"
                  ).length;

                  const isToday =
                    currentMonth === month &&
                    day === new Date().getDate();

                  const isFuture =
                    month > currentMonth ||
                    (month === currentMonth &&
                      day > new Date().getDate());

                  const hasRecords = dayLogs.length > 0;

                  return (
                    <Link
                      key={dateKey}
                      href={isFuture ? "#" : `/history/${dateKey}`}
                      onClick={(e) => {
                        if (isFuture) e.preventDefault();
                      }}
                      className={`min-h-[76px] sm:min-h-24 rounded-xl sm:rounded-2xl p-1.5 sm:p-3 border transition ${
                        isFuture
                          ? "bg-gray-50 border-gray-100 opacity-40 cursor-not-allowed"
                          : isToday
                            ? "bg-green-50 border-green-400 ring-1 ring-green-200"
                            : hasRecords
                              ? "bg-white border-green-100 hover:bg-green-50 hover:border-green-300"
                              : "bg-gray-50 border-gray-100 hover:bg-green-50 hover:border-green-200"
                      }`}
                    >
                      <p
                        className={`text-sm sm:text-base font-bold ${
                          isToday ? "text-green-800" : "text-gray-800"
                        }`}
                      >
                        {formatNumber(day)}
                      </p>

                      {hasRecords && (
                        <div className="mt-1.5 space-y-1">
                          {completed > 0 && (
                            <p className="text-[10px] sm:text-xs text-green-700 font-semibold">
                              ✓ {formatNumber(completed)}
                            </p>
                          )}

                          {missed > 0 && (
                            <p className="text-[10px] sm:text-xs text-red-600 font-semibold">
                              ✕ {formatNumber(missed)}
                            </p>
                          )}
                        </div>
                      )}

                      {!hasRecords && !isFuture && (
                        <p className="hidden sm:block text-[10px] text-gray-400 mt-2">
                          {t("No records", "কোনো রেকর্ড নেই")}
                        </p>
                      )}
                    </Link>
                  );
                })}

              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-5 mt-6 pt-5 border-t border-gray-100 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-600" />
                  <span className="text-gray-600">
                    {t("Completed", "সম্পন্ন")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-gray-600">
                    {t("Missed", "ছুটে গেছে")}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-300" />
                  <span className="text-gray-600">
                    {t("No records", "কোনো রেকর্ড নেই")}
                  </span>
                </div>
              </div>
            </>
          )}

          {message && (
            <div className="bg-red-50 text-red-700 rounded-xl p-4 mt-5 text-sm">
              {message}
            </div>
          )}
        </section>

        <footer className="text-center mt-9 pb-5">
          <p className="text-gray-500 text-sm">
            {t(
              "Every day is another opportunity to improve.",
              "প্রতিটি দিন নিজেকে উন্নত করার নতুন সুযোগ।"
            )}
          </p>
        </footer>

      </div>
    </main>
  );
}
