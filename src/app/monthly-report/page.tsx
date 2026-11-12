
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/context/LanguageContext";

type PrayerLog = {
  prayer_date: string;
  prayer_name: string;
  status: string;
};

function getMonthString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default function MonthlyReportPage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [month, setMonth] = useState(getMonthString(new Date()));
  const [logs, setLogs] = useState<PrayerLog[]>([]);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const formatNumber = (value: number) =>
    value.toLocaleString(language === "bn" ? "bn-BD" : "en-US");

  useEffect(() => {
    async function loadReport() {
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

        setFullName(
          user.user_metadata?.full_name ||
            user.email ||
            "Namaz Tracker User"
        );

        const [year, monthNumber] = month.split("-").map(Number);
        const startDate = `${month}-01`;
        const lastDay = new Date(year, monthNumber, 0).getDate();
        const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

        const { data, error } = await supabase
          .from("prayer_logs")
          .select("prayer_date, prayer_name, status")
          .eq("user_id", user.id)
          .gte("prayer_date", startDate)
          .lte("prayer_date", endDate);

        if (error) throw error;

        setLogs(data || []);
      } catch (error) {
        console.error("Monthly Report Error:", error);
        setMessage(
          error instanceof Error
            ? error.message
            : t("Could not load report.", "রিপোর্ট লোড করা যায়নি।")
        );
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [month, router, t]);

  const [year, monthNumber] = month.split("-").map(Number);

  const currentMonth = getMonthString(new Date());
  const isCurrentMonth = month === currentMonth;
  const isFutureMonth = month > currentMonth;

  const totalDays = new Date(year, monthNumber, 0).getDate();

  const elapsedDays = isFutureMonth
    ? 0
    : isCurrentMonth
      ? new Date().getDate()
      : totalDays;

  const totalExpected = elapsedDays * 5;

  const stats = useMemo(() => {
    const jamaat = logs.filter((x) => x.status === "Jamaat").length;
    const alone = logs.filter((x) => x.status === "Alone").length;
    const missed = logs.filter((x) => x.status === "Missed").length;

    const recorded = jamaat + alone + missed;
    const completed = jamaat + alone;
    const notRecorded = Math.max(0, totalExpected - recorded);

    const percentage =
      totalExpected > 0
        ? Math.round((completed / totalExpected) * 100)
        : 0;

    return {
      jamaat,
      alone,
      missed,
      recorded,
      completed,
      notRecorded,
      percentage,
    };
  }, [logs, totalExpected]);

  const monthName = new Date(year, monthNumber - 1).toLocaleString(
    language === "bn" ? "bn-BD" : "en-US",
    { month: "long", year: "numeric" }
  );

  function changeMonth(amount: number) {
    const newDate = new Date(year, monthNumber - 1 + amount, 1);
    setMonth(getMonthString(newDate));
  }

  const circleStyle = {
    background: `conic-gradient(#059669 ${Math.min(
      stats.percentage,
      100
    )}%, #e5e7eb 0)`,
  };

  return (
    <main className="min-h-screen bg-[#f5f7f1] p-3 sm:p-6">

      {/* WEBSITE REPORT - Screen only */}
      <div className="max-w-6xl mx-auto screen-report">

        <Navigation />

        {/* Header */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-950 via-green-800 to-emerald-700 text-white p-6 sm:p-9 shadow-xl">

          <div className="absolute -right-16 -top-20 w-72 h-72 rounded-full bg-white/5" />
          <div className="absolute right-32 -bottom-32 w-72 h-72 rounded-full bg-white/5" />

          <div className="relative z-10">
            <p className="text-green-200 text-xs sm:text-sm font-bold tracking-widest">
              {t(
                "YOUR MONTHLY WORSHIP JOURNEY",
                "আপনার মাসিক ইবাদতের যাত্রা"
              )}
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold mt-3">
              {t("Monthly Salah Report", "মাসিক নামাজের রিপোর্ট")}
            </h1>

            <p className="text-green-100 mt-3 max-w-xl leading-relaxed">
              {t(
                "A complete overview of your five daily prayers, consistency and monthly progress.",
                "আপনার পাঁচ ওয়াক্ত নামাজ, নিয়মিততা এবং মাসিক অগ্রগতির সম্পূর্ণ পরিসংখ্যান।"
              )}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">

              <button
                onClick={() => changeMonth(-1)}
                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 font-bold"
                aria-label="Previous month"
              >
                ←
              </button>

              <div className="px-5 py-2.5 rounded-xl bg-white/15 border border-white/20 font-semibold">
                📅 {monthName}
              </div>

              <button
                onClick={() => changeMonth(1)}
                disabled={month >= currentMonth}
                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 font-bold disabled:opacity-30"
                aria-label="Next month"
              >
                →
              </button>

              <button
                onClick={() => window.print()}
                disabled={loading || !!message}
                className="px-5 py-2.5 rounded-xl bg-white text-green-900 font-bold hover:bg-green-50 transition disabled:opacity-50"
              >
                🖨️ {t("Print Report", "রিপোর্ট প্রিন্ট")}
              </button>

            </div>
          </div>
        </section>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 mt-7 text-center text-green-800 shadow-sm">
            {t("Loading monthly report...", "মাসিক রিপোর্ট লোড হচ্ছে...")}
          </div>
        ) : (
          <>
            {message && (
              <div className="mt-6 p-4 rounded-xl bg-red-50 text-red-700">
                {message}
              </div>
            )}

            {/* Main Overview */}
            <section className="mt-7 grid grid-cols-1 lg:grid-cols-5 gap-5">

              {/* Overall Performance */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-green-100">

                <p className="text-sm font-bold text-green-700">
                  {t("OVERALL PERFORMANCE", "সামগ্রিক পারফরম্যান্স")}
                </p>

                <div className="flex flex-col items-center py-7">

                  <div
                    className="w-52 h-52 rounded-full flex items-center justify-center"
                    style={circleStyle}
                  >
                    <div className="w-40 h-40 rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
                      <span className="text-4xl font-extrabold text-green-800">
                        {formatNumber(stats.percentage)}%
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        {t("Completion Rate", "সম্পন্নের হার")}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mt-6">
                    {formatNumber(stats.completed)} / {formatNumber(totalExpected)}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    {t("Prayers Completed", "সম্পন্ন নামাজ")}
                  </p>
                </div>

                <div className="bg-green-50 rounded-2xl p-4 text-center">
                  <p className="text-sm text-green-800">
                    {t("Total Expected Prayers", "মোট প্রত্যাশিত নামাজ")}
                  </p>
                  <h3 className="text-3xl font-extrabold text-green-900 mt-1">
                    {formatNumber(totalExpected)}
                  </h3>
                </div>
              </div>

              {/* Status Statistics */}
              <div className="lg:col-span-3 grid grid-cols-2 gap-4">

                <div className="bg-white rounded-3xl p-5 shadow-sm border border-green-100">
                  <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-2xl">
                    🕌
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    {t("Jamaat", "জামাতে")}
                  </p>
                  <h3 className="text-3xl font-extrabold text-green-700 mt-1">
                    {formatNumber(stats.jamaat)}
                  </h3>
                  <p className="text-xs text-green-600 mt-2">
                    {totalExpected > 0
                      ? formatNumber(Math.round((stats.jamaat / totalExpected) * 100))
                      : 0}% {t("of expected", "প্রত্যাশিতের মধ্যে")}
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-5 shadow-sm border border-blue-100">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl">
                    🤲
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    {t("Alone", "একা")}
                  </p>
                  <h3 className="text-3xl font-extrabold text-blue-700 mt-1">
                    {formatNumber(stats.alone)}
                  </h3>
                  <p className="text-xs text-blue-600 mt-2">
                    {totalExpected > 0
                      ? formatNumber(Math.round((stats.alone / totalExpected) * 100))
                      : 0}% {t("of expected", "প্রত্যাশিতের মধ্যে")}
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-5 shadow-sm border border-red-100">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-2xl">
                    ⏳
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    {t("Missed", "ছুটে গেছে")}
                  </p>
                  <h3 className="text-3xl font-extrabold text-red-600 mt-1">
                    {formatNumber(stats.missed)}
                  </h3>
                  <p className="text-xs text-red-500 mt-2">
                    {totalExpected > 0
                      ? formatNumber(Math.round((stats.missed / totalExpected) * 100))
                      : 0}% {t("of expected", "প্রত্যাশিতের মধ্যে")}
                  </p>
                </div>

                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-200">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl">
                    📝
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    {t("Not Recorded", "রেকর্ড করা হয়নি")}
                  </p>
                  <h3 className="text-3xl font-extrabold text-gray-700 mt-1">
                    {formatNumber(stats.notRecorded)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-2">
                    {t("No status saved", "কোনো স্ট্যাটাস সংরক্ষিত নেই")}
                  </p>
                </div>

                <div className="col-span-2 bg-gradient-to-r from-emerald-800 to-green-700 rounded-3xl p-5 text-white shadow-sm">
                  <p className="text-green-100 text-sm">
                    {t("Total Recorded Prayers", "মোট রেকর্ডকৃত নামাজ")}
                  </p>
                  <h3 className="text-3xl font-extrabold mt-1">
                    {formatNumber(stats.recorded)}
                  </h3>
                  <p className="text-xs text-green-100 mt-2">
                    {t(
                      "Jamaat + Alone + Missed",
                      "জামাতে + একা + ছুটে গেছে"
                    )}
                  </p>
                </div>

              </div>
            </section>

            {/* Prayer Wise Statistics */}
            <section className="mt-7 bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-green-100">

              <div className="mb-7">
                <p className="text-sm font-bold text-green-700">
                  {t("PRAYER-WISE ANALYSIS", "ওয়াক্তভিত্তিক বিশ্লেষণ")}
                </p>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">
                  {t("Five Daily Prayers", "পাঁচ ওয়াক্ত নামাজ")}
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                  {t(
                    "Compare your completion across each prayer.",
                    "প্রতিটি ওয়াক্তের নামাজ সম্পন্নের তুলনা দেখুন।"
                  )}
                </p>
              </div>

              <div className="space-y-7">
                {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map((prayer) => {
                  const prayerLogs = logs.filter(
                    (log) =>
                      log.prayer_name.toLowerCase() === prayer.toLowerCase()
                  );

                  const jamaat = prayerLogs.filter(
                    (log) => log.status === "Jamaat"
                  ).length;

                  const alone = prayerLogs.filter(
                    (log) => log.status === "Alone"
                  ).length;

                  const missed = prayerLogs.filter(
                    (log) => log.status === "Missed"
                  ).length;

                  const completed = jamaat + alone;
                  const percentage =
                    elapsedDays > 0
                      ? Math.round((completed / elapsedDays) * 100)
                      : 0;

                  const labels: Record<string, string> = {
                    Fajr: t("Fajr", "ফজর"),
                    Dhuhr: t("Dhuhr", "যোহর"),
                    Asr: t("Asr", "আসর"),
                    Maghrib: t("Maghrib", "মাগরিব"),
                    Isha: t("Isha", "ইশা"),
                  };

                  return (
                    <div key={prayer}>
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h3 className="font-bold text-gray-800">
                            {labels[prayer]}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatNumber(completed)} / {formatNumber(elapsedDays)}{" "}
                            {t("completed", "সম্পন্ন")}
                          </p>
                        </div>

                        <span className="text-lg font-extrabold text-green-800">
                          {formatNumber(percentage)}%
                        </span>
                      </div>

                      <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-green-600"
                          style={{
                            width: `${elapsedDays > 0 ? (jamaat / elapsedDays) * 100 : 0}%`,
                          }}
                        />
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${elapsedDays > 0 ? (alone / elapsedDays) * 100 : 0}%`,
                          }}
                        />
                        <div
                          className="h-full bg-red-500"
                          style={{
                            width: `${elapsedDays > 0 ? (missed / elapsedDays) * 100 : 0}%`,
                          }}
                        />
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-xs text-gray-500">
                        <span>🟢 {t("Jamaat", "জামাত")}: {formatNumber(jamaat)}</span>
                        <span>🔵 {t("Alone", "একা")}: {formatNumber(alone)}</span>
                        <span>🔴 {t("Missed", "ছুটে গেছে")}: {formatNumber(missed)}</span>
                        <span>⚪ {t("Not Recorded", "রেকর্ড নেই")}: {formatNumber(Math.max(0, elapsedDays - jamaat - alone - missed))}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-5 mt-8 pt-5 border-t border-gray-100 text-xs text-gray-600">
                <span>🟢 {t("Jamaat", "জামাত")}</span>
                <span>🔵 {t("Alone", "একা")}</span>
                <span>🔴 {t("Missed", "ছুটে গেছে")}</span>
                <span>⚪ {t("Not Recorded", "রেকর্ড নেই")}</span>
              </div>
            </section>

            {/* Summary */}
            <section className="mt-7 bg-gradient-to-br from-green-950 via-green-900 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg">

              <p className="text-green-200 text-sm font-bold">
                {t("MONTHLY SUMMARY", "মাসিক সারসংক্ষেপ")}
              </p>

              <h2 className="text-2xl font-bold mt-2">
                {t("Your Progress at a Glance", "এক নজরে আপনার অগ্রগতি")}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mt-7">
                <div>
                  <p className="text-green-200 text-xs">
                    {t("Expected", "প্রত্যাশিত")}
                  </p>
                  <h3 className="text-2xl font-bold mt-1">
                    {formatNumber(totalExpected)}
                  </h3>
                </div>

                <div>
                  <p className="text-green-200 text-xs">
                    {t("Completed", "সম্পন্ন")}
                  </p>
                  <h3 className="text-2xl font-bold mt-1">
                    {formatNumber(stats.completed)}
                  </h3>
                </div>

                <div>
                  <p className="text-green-200 text-xs">
                    {t("Missed", "ছুটে গেছে")}
                  </p>
                  <h3 className="text-2xl font-bold mt-1">
                    {formatNumber(stats.missed)}
                  </h3>
                </div>

                <div>
                  <p className="text-green-200 text-xs">
                    {t("Not Recorded", "রেকর্ড নেই")}
                  </p>
                  <h3 className="text-2xl font-bold mt-1">
                    {formatNumber(stats.notRecorded)}
                  </h3>
                </div>
              </div>

              <div className="mt-7 pt-5 border-t border-white/15">
                <p className="text-sm text-green-100 leading-relaxed">
                  {t(
                    `You completed ${stats.completed} out of ${totalExpected} expected prayers during ${monthName}.`,
                    `${monthName}-এ মোট ${formatNumber(totalExpected)}টি প্রত্যাশিত নামাজের মধ্যে ${formatNumber(stats.completed)}টি সম্পন্ন হয়েছে।`
                  )}
                </p>
              </div>
            </section>
          </>
        )}

        <footer className="text-center mt-9 pb-5">
          <p className="text-gray-500 text-sm">
            {t(
              "Consistency in worship is built one prayer at a time.",
              "প্রতিটি নামাজের মাধ্যমে ইবাদতের ধারাবাহিকতা গড়ে ওঠে।"
            )}
          </p>
        </footer>

      </div>

      {/* PDF REPORT - Print only */}
      {!loading && !message && (
        <div className="print-report">

          <div className="pdf-header">
            <div className="pdf-brand">
              <div className="pdf-logo">☪</div>
              <div>
                <div className="pdf-brand-name">NAMAZ TRACKER</div>
                <div className="pdf-brand-subtitle">
                  {t("PERSONAL WORSHIP JOURNAL", "ব্যক্তিগত ইবাদত জার্নাল")}
                </div>
              </div>
            </div>

            <div className="pdf-title">
              {t("MONTHLY SALAH REPORT", "মাসিক নামাজের রিপোর্ট")}
            </div>

            <h1 className="pdf-name">{fullName}</h1>

            <div className="pdf-month">{monthName}</div>
          </div>

          <div className="pdf-divider" />

          <div className="pdf-section-heading">
            {t("OVERALL PERFORMANCE", "সামগ্রিক পারফরম্যান্স")}
          </div>

          <div className="pdf-performance">
            <div
              className="pdf-circle"
              style={{
                background: `conic-gradient(#059669 ${Math.min(
                  stats.percentage,
                  100
                )}%, #e5e7eb 0)`,
              }}
            >
              <div className="pdf-circle-inner">
                <div className="pdf-percentage">
                  {formatNumber(stats.percentage)}%
                </div>
                <div className="pdf-circle-label">
                  {t("Completed", "সম্পন্ন")}
                </div>
              </div>
            </div>

            <div className="pdf-performance-details">
              <div className="pdf-completed-number">
                {formatNumber(stats.completed)}
                <span> / {formatNumber(totalExpected)}</span>
              </div>

              <div className="pdf-detail-label">
                {t("Prayers Completed", "সম্পন্ন নামাজ")}
              </div>

              <div className="pdf-progress-track">
                <div
                  className="pdf-progress-fill"
                  style={{
                    width: `${Math.min(stats.percentage, 100)}%`,
                  }}
                />
              </div>

              <div className="pdf-expected">
                {t("Total Expected Prayers", "মোট প্রত্যাশিত নামাজ")}:{" "}
                <strong>{formatNumber(totalExpected)}</strong>
              </div>
            </div>
          </div>

          <div className="pdf-section-heading pdf-status-heading">
            {t("PRAYER STATUS BREAKDOWN", "নামাজের পরিসংখ্যান")}
          </div>

          <div className="pdf-stats-grid">

            <div className="pdf-stat-card pdf-jamaat">
              <div className="pdf-stat-label">
                {t("Jamaat", "জামাতে")}
              </div>
              <div className="pdf-stat-number">
                {formatNumber(stats.jamaat)}
              </div>
              <div className="pdf-stat-sub">
                {t("Prayers", "টি নামাজ")}
              </div>
            </div>

            <div className="pdf-stat-card pdf-alone">
              <div className="pdf-stat-label">
                {t("Alone", "একা")}
              </div>
              <div className="pdf-stat-number">
                {formatNumber(stats.alone)}
              </div>
              <div className="pdf-stat-sub">
                {t("Prayers", "টি নামাজ")}
              </div>
            </div>

            <div className="pdf-stat-card pdf-missed">
              <div className="pdf-stat-label">
                {t("Missed", "ছুটে গেছে")}
              </div>
              <div className="pdf-stat-number">
                {formatNumber(stats.missed)}
              </div>
              <div className="pdf-stat-sub">
                {t("Prayers", "টি নামাজ")}
              </div>
            </div>

            <div className="pdf-stat-card pdf-not-recorded">
              <div className="pdf-stat-label">
                {t("Not Recorded", "রেকর্ড করা হয়নি")}
              </div>
              <div className="pdf-stat-number">
                {formatNumber(stats.notRecorded)}
              </div>
              <div className="pdf-stat-sub">
                {t("Prayers", "টি নামাজ")}
              </div>
            </div>

          </div>

          <div className="pdf-total-box">
            <div>
              <div className="pdf-total-label">
                {t("TOTAL RECORDED PRAYERS", "মোট রেকর্ডকৃত নামাজ")}
              </div>
              <div className="pdf-total-sub">
                {t(
                  "Jamaat + Alone + Missed",
                  "জামাতে + একা + ছুটে গেছে"
                )}
              </div>
            </div>

            <div className="pdf-total-number">
              {formatNumber(stats.recorded)}
            </div>
          </div>

          <div className="pdf-footer">
            <div className="pdf-footer-line" />
            <div className="pdf-footer-text">
              {t(
                "Consistency in worship is built one prayer at a time.",
                "প্রতিটি নামাজের মাধ্যমে ইবাদতের ধারাবাহিকতা গড়ে ওঠে।"
              )}
            </div>
            <div className="pdf-footer-brand">
              NAMAZ TRACKER
            </div>
          </div>

        </div>
      )}

      <style jsx global>{`
        .print-report {
          display: none;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          html,
          body {
            width: 210mm !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .screen-report {
            display: none !important;
          }

          .print-report {
            display: flex !important;
            flex-direction: column;
            width: 100%;
            height: 270mm;
            max-height: 270mm;
            overflow: hidden;
            box-sizing: border-box;
            padding: 8mm 7mm;
            background: white !important;
            color: #1f2937;
            font-family: Arial, sans-serif;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .pdf-header {
            text-align: center;
          }

          .pdf-brand {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 10px;
            margin-bottom: 24px;
          }

          .pdf-logo {
            width: 38px;
            height: 38px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #065f46;
            color: white;
            font-size: 25px;
          }

          .pdf-brand-name {
            font-size: 14px;
            font-weight: 900;
            letter-spacing: 2px;
            color: #065f46;
            text-align: left;
          }

          .pdf-brand-subtitle {
            font-size: 8px;
            letter-spacing: 1.5px;
            color: #6b7280;
            margin-top: 3px;
            text-align: left;
          }

          .pdf-title {
            font-size: 21px;
            font-weight: 900;
            letter-spacing: 1.5px;
            color: #064e3b;
            margin-bottom: 12px;
          }

          .pdf-name {
            font-size: 20px;
            font-weight: 800;
            color: #1f2937;
            margin: 0;
          }

          .pdf-month {
            font-size: 13px;
            font-weight: 600;
            color: #059669;
            margin-top: 6px;
          }

          .pdf-divider {
            height: 2px;
            background: #d1fae5;
            margin: 22px 0;
          }

          .pdf-section-heading {
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 1.2px;
            color: #047857;
            margin-bottom: 16px;
          }

          .pdf-performance {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 38px;
            padding: 12px 10px 25px;
          }

          .pdf-circle {
            width: 145px;
            height: 145px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .pdf-circle-inner {
            width: 112px;
            height: 112px;
            border-radius: 50%;
            background: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }

          .pdf-percentage {
            font-size: 30px;
            font-weight: 900;
            color: #065f46;
          }

          .pdf-circle-label {
            font-size: 10px;
            color: #6b7280;
            margin-top: 3px;
          }

          .pdf-performance-details {
            flex: 1;
            max-width: 290px;
          }

          .pdf-completed-number {
            font-size: 32px;
            font-weight: 900;
            color: #064e3b;
          }

          .pdf-completed-number span {
            font-size: 18px;
            color: #9ca3af;
            font-weight: 600;
          }

          .pdf-detail-label {
            font-size: 12px;
            color: #6b7280;
            margin-top: 3px;
          }

          .pdf-progress-track {
            width: 100%;
            height: 12px;
            border-radius: 20px;
            background: #e5e7eb;
            overflow: hidden;
            margin-top: 17px;
          }

          .pdf-progress-fill {
            height: 100%;
            border-radius: 20px;
            background: #059669;
          }

          .pdf-expected {
            font-size: 11px;
            color: #4b5563;
            margin-top: 12px;
          }

          .pdf-expected strong {
            color: #065f46;
            font-size: 13px;
          }

          .pdf-status-heading {
            margin-top: 12px;
          }

          .pdf-stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }

          .pdf-stat-card {
            padding: 20px 22px;
            border-radius: 14px;
            border: 1px solid #e5e7eb;
            background: #f9fafb;
          }

          .pdf-stat-label {
            font-size: 13px;
            font-weight: 800;
          }

          .pdf-stat-number {
            font-size: 31px;
            font-weight: 900;
            margin-top: 8px;
          }

          .pdf-stat-sub {
            font-size: 10px;
            color: #6b7280;
            margin-top: 3px;
          }

          .pdf-jamaat {
            background: #ecfdf5;
            border-color: #a7f3d0;
          }

          .pdf-jamaat .pdf-stat-label,
          .pdf-jamaat .pdf-stat-number {
            color: #047857;
          }

          .pdf-alone {
            background: #eff6ff;
            border-color: #bfdbfe;
          }

          .pdf-alone .pdf-stat-label,
          .pdf-alone .pdf-stat-number {
            color: #2563eb;
          }

          .pdf-missed {
            background: #fef2f2;
            border-color: #fecaca;
          }

          .pdf-missed .pdf-stat-label,
          .pdf-missed .pdf-stat-number {
            color: #dc2626;
          }

          .pdf-not-recorded {
            background: #f3f4f6;
            border-color: #d1d5db;
          }

          .pdf-not-recorded .pdf-stat-label,
          .pdf-not-recorded .pdf-stat-number {
            color: #4b5563;
          }

          .pdf-total-box {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 22px;
            margin-top: 18px;
            border-radius: 14px;
            background: #064e3b;
            color: white;
          }

          .pdf-total-label {
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 1px;
          }

          .pdf-total-sub {
            font-size: 10px;
            color: #d1fae5;
            margin-top: 5px;
          }

          .pdf-total-number {
            font-size: 30px;
            font-weight: 900;
          }

          .pdf-footer {
            margin-top: auto;
            text-align: center;
            padding-top: 20px;
          }

          .pdf-footer-line {
            height: 1px;
            background: #d1d5db;
            margin-bottom: 15px;
          }

          .pdf-footer-text {
            font-size: 11px;
            color: #6b7280;
            font-style: italic;
          }

          .pdf-footer-brand {
            font-size: 9px;
            color: #059669;
            font-weight: 900;
            letter-spacing: 2px;
            margin-top: 10px;
          }
        }
      `}</style>
    </main>
  );
}
