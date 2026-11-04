
import { supabase } from "@/lib/supabase";
import { dailyContent } from "@/lib/dailyContent";
import { getPrayerTimes } from "@/lib/getPrayerTimes";

const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const amalNames = [
  "Fajr Prayer",
  "Morning and Evening Dhikr",
  "Recitation of the Quran",
  "Ayatul Kursi",
  "Istighfar",
  "Durood Sharif",
];

export async function getDailyReportData(date: string) {
  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("User not logged in");
  }

  const user = authData.user;

  const [prayerResult, amalResult, quranResult, prayerTimes] =
    await Promise.all([
      supabase
        .from("prayer_logs")
        .select("prayer_name, status")
        .eq("user_id", user.id)
        .eq("prayer_date", date),

      supabase
        .from("daily_amals")
        .select("amal_name, completed")
        .eq("user_id", user.id)
        .eq("amal_date", date),

      supabase
        .from("quran_logs")
        .select(
          "activity_type, surah_name, start_ayah, end_ayah, pages"
        )
        .eq("user_id", user.id)
        .eq("activity_date", date),

      getPrayerTimes(date),
    ]);

  if (prayerResult.error) throw prayerResult.error;
  if (amalResult.error) throw amalResult.error;
  if (quranResult.error) throw quranResult.error;

  const prayerLogs = prayerResult.data || [];
  const amalLogs = amalResult.data || [];
  const quranLogs = quranResult.data || [];

  const reportPrayers = prayers.map((name) => {
    const found = prayerLogs.find(
      (item) => item.prayer_name === name
    );

    return {
      name,
      status: found?.status || "Not Recorded",
    };
  });

  const reportAmals = amalNames.map((name) => {
    const found = amalLogs.find(
      (item) => item.amal_name === name
    );

    return {
      name,
      completed: found?.completed || false,
    };
  });

  const reportQuranLogs = quranLogs.map((log) => ({
    activityType: log.activity_type,
    surahName: log.surah_name,
    startAyah: log.start_ayah,
    endAyah: log.end_ayah,
    pages: log.pages ?? 0,
  }));

  const completedPrayers = reportPrayers.filter(
    (item) =>
      item.status === "Jamaat" || item.status === "Alone"
  ).length;

  const completedAmals = reportAmals.filter(
    (item) => item.completed
  ).length;

  const progress = Math.round(
    ((completedPrayers + completedAmals) / 11) * 100
  );

  const selectedDate = new Date(`${date}T12:00:00`);

  const dayIndex =
    (selectedDate.getDate() - 1) % dailyContent.length;

  const content = dailyContent[dayIndex];

  return {
    fullName: user.user_metadata?.full_name || "User",

    englishDate: selectedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),

    banglaDate: new Intl.DateTimeFormat("bn-BD-u-ca-beng", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(selectedDate),

    hijriDate:
      new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(selectedDate) + " (Approximate)",

    weekdayEnglish: selectedDate.toLocaleDateString("en-US", {
      weekday: "long",
    }),

    weekdayBangla: selectedDate.toLocaleDateString("bn-BD", {
      weekday: "long",
    }),

    weekdayArabic: selectedDate.toLocaleDateString("ar-SA", {
      weekday: "long",
    }),

    prayers: reportPrayers,
    prayerTimes,
    amals: reportAmals,

    ayahBn: content.ayahBn,
    ayahRef: content.ayahRef,

    hadithBn: content.hadithBn,
    hadithRef: content.hadithRef,

    quranLogs: reportQuranLogs,

    progress,
  };
}
