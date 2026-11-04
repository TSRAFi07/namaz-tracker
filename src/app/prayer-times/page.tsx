
"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/context/LanguageContext";

type PrayerTimes = {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Sunrise: string;
  Sunset: string;
};

const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

const prayerIcons: Record<string, string> = {
  Fajr: "🌅",
  Dhuhr: "☀️",
  Asr: "🌤️",
  Maghrib: "🌇",
  Isha: "🌙",
};

function getLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function cleanTime(time: string) {
  return time.split(" ")[0];
}

function getPrayerDate(date: string, time: string) {
  const [hours, minutes] = cleanTime(time).split(":").map(Number);
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

export default function PrayerTimesPage() {
  const { language, t } = useLanguage();

  const [todayTimes, setTodayTimes] = useState<PrayerTimes | null>(null);
  const [tomorrowTimes, setTomorrowTimes] = useState<PrayerTimes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());

  const translatePrayer = (prayer: string) => {
    const names: Record<string, string> = {
      Fajr: t("Fajr", "ফজর"),
      Dhuhr: t("Dhuhr", "যোহর"),
      Asr: t("Asr", "আসর"),
      Maghrib: t("Maghrib", "মাগরিব"),
      Isha: t("Isha", "ইশা"),
    };

    return names[prayer] || prayer;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString(
      language === "bn" ? "bn-BD" : "en-US",
      {
        minimumIntegerDigits: 2,
        useGrouping: false,
      }
    );
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadPrayerTimes() {
      try {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayDate = getLocalDate(today);
        const tomorrowDate = getLocalDate(tomorrow);
        const baseUrl = "https://api.aladhan.com/v1/timingsByCity";

        const [todayResponse, tomorrowResponse] = await Promise.all([
          fetch(`${baseUrl}/${todayDate}?city=Jashore&country=Bangladesh&method=1&school=1`),
          fetch(`${baseUrl}/${tomorrowDate}?city=Jashore&country=Bangladesh&method=1&school=1`),
        ]);

        if (!todayResponse.ok || !tomorrowResponse.ok) {
          throw new Error("Unable to load prayer times.");
        }

        const todayData = await todayResponse.json();
        const tomorrowData = await tomorrowResponse.json();

        if (todayData.code !== 200 || tomorrowData.code !== 200) {
          throw new Error("Prayer time data is unavailable.");
        }

        setTodayTimes(todayData.data.timings);
        setTomorrowTimes(tomorrowData.data.timings);
      } catch {
        setError("Prayer times could not be loaded. Please refresh.");
      } finally {
        setLoading(false);
      }
    }

    loadPrayerTimes();
  }, []);

  const today = getLocalDate(now);

  let nextPrayer = "Fajr";
  let nextPrayerTime = "";
  let nextPrayerDate = "";

  if (todayTimes && tomorrowTimes) {
    let found = false;

    for (const prayer of prayerNames) {
      const prayerDate = getPrayerDate(today, todayTimes[prayer]);

      if (prayerDate > now) {
        nextPrayer = prayer;
        nextPrayerTime = todayTimes[prayer];
        nextPrayerDate = today;
        found = true;
        break;
      }
    }

    if (!found) {
      nextPrayer = "Fajr";
      nextPrayerTime = tomorrowTimes.Fajr;

      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      nextPrayerDate = getLocalDate(tomorrow);
    }
  }

  const targetTime = nextPrayerDate
    ? getPrayerDate(nextPrayerDate, nextPrayerTime)
    : null;

  const remaining = targetTime
    ? Math.max(0, Math.floor((targetTime.getTime() - now.getTime()) / 1000))
    : 0;

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  const formatTime = (time: string) => {
    const [hour, minute] = cleanTime(time).split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${formatNumber(displayHour)}:${formatNumber(minute)} ${
      language === "bn"
        ? period === "AM" ? "পূর্বাহ্ণ" : "অপরাহ্ণ"
        : period
    }`;
  };

  return (
    <main className="min-h-screen bg-[#f5f7f1] px-4 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto">
        <Navigation />

        <header className="mt-8 mb-7">
          <p className="text-sm font-semibold text-emerald-700">
            {t("DAILY SCHEDULE", "দৈনিক সময়সূচি")}
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
            {t("Prayer Times", "নামাজের সময়সূচি")}
          </h1>

          <p className="text-gray-500 mt-2">
            {t(
              "Your five daily prayers, all in one place.",
              "পাঁচ ওয়াক্ত নামাজের সময়সূচি এক জায়গায়।"
            )}
          </p>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 text-gray-700">
            <span className="text-xl">📍</span>
            <div>
              <p className="font-semibold text-sm">
                {t("Jashore, Bangladesh", "যশোর, বাংলাদেশ")}
              </p>
              <p className="text-xs text-gray-500">
                {t("Local prayer schedule", "স্থানীয় নামাজের সময়সূচি")}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl px-4 py-2 shadow-sm">
            <p className="text-sm font-medium text-gray-700">
              {now.toLocaleDateString(language === "bn" ? "bn-BD" : "en-BD", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
            <div className="text-3xl mb-3">🕌</div>
            <p className="text-gray-600 font-medium">
              {t("Loading prayer times...", "নামাজের সময় লোড হচ্ছে...")}
            </p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <p className="text-red-600 font-medium">
              {t(
                "Prayer times could not be loaded. Please refresh.",
                "নামাজের সময় লোড করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।"
              )}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-emerald-700 text-white px-5 py-2 rounded-xl hover:bg-emerald-800"
            >
              {t("Refresh", "রিফ্রেশ করুন")}
            </button>
          </div>
        ) : todayTimes && tomorrowTimes ? (
          <>
            <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-green-800 to-teal-700 rounded-3xl p-6 sm:p-9 text-white shadow-lg mb-6">
              <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
              <div className="absolute -right-4 -bottom-20 w-56 h-56 rounded-full bg-white/5" />

              <div className="relative text-center">
                <p className="text-emerald-100 text-xs sm:text-sm font-semibold tracking-[0.2em]">
                  {t("NEXT PRAYER", "পরবর্তী নামাজ")}
                </p>

                <div className="text-4xl mt-4">
                  {prayerIcons[nextPrayer]}
                </div>

                <h2 className="text-3xl sm:text-4xl font-bold mt-2">
                  {translatePrayer(nextPrayer)}
                </h2>

                <p className="text-emerald-100 mt-2 text-lg">
                  {formatTime(nextPrayerTime)}
                </p>

                <p className="text-emerald-100/80 text-sm mt-1">
                  {nextPrayerDate === today
                    ? t("Today's prayer", "আজকের নামাজ")
                    : t("Tomorrow's prayer", "আগামীকালের নামাজ")}
                </p>

                <div className="flex justify-center gap-3 sm:gap-5 mt-7">
                  {[
                    { label: t("Hours", "ঘণ্টা"), value: hours },
                    { label: t("Minutes", "মিনিট"), value: minutes },
                    { label: t("Seconds", "সেকেন্ড"), value: seconds },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 min-w-[75px] sm:min-w-[95px]"
                    >
                      <p className="text-2xl sm:text-3xl font-bold tabular-nums">
                        {formatNumber(item.value)}
                      </p>
                      <p className="text-xs text-emerald-100 mt-1">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {t("Today's Prayer Schedule", "আজকের নামাজের সময়সূচি")}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {t("Five obligatory prayers", "পাঁচ ওয়াক্ত ফরজ নামাজ")}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-2xl">
                  🕌
                </div>
              </div>

              <div className="space-y-3">
                {prayerNames.map((prayer) => {
                  const endTime =
                    prayer === "Fajr"
                      ? todayTimes.Sunrise
                      : prayer === "Dhuhr"
                      ? todayTimes.Asr
                      : prayer === "Asr"
                      ? todayTimes.Sunset
                      : prayer === "Maghrib"
                      ? todayTimes.Isha
                      : tomorrowTimes.Fajr;

                  const isNext =
                    prayer === nextPrayer && nextPrayerDate === today;

                  return (
                    <div
                      key={prayer}
                      className={`flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-5 rounded-2xl border transition ${
                        isNext
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm">
                          {prayerIcons[prayer]}
                        </div>

                        <div>
                          <p className="font-bold text-sm sm:text-base text-gray-800">
                            {translatePrayer(prayer)}
                          </p>
                          {isNext && (
                            <span className="text-xs font-semibold text-emerald-700">
                              {t("Next Prayer", "পরবর্তী নামাজ")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-5 text-right shrink-0">
                        <div>
                          <p className="text-[10px] font-semibold tracking-wider text-gray-500">
                            {t("START", "শুরু")}
                          </p>
                          <p className="text-sm sm:text-lg font-bold text-emerald-900">
                            {formatTime(todayTimes[prayer])}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold tracking-wider text-gray-500">
                            {t("END", "শেষ")}
                          </p>
                          <p className="text-sm sm:text-lg font-bold text-emerald-700">
                            {formatTime(endTime)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-500">
                  {t("Calculation Method", "সময় গণনার পদ্ধতি")}
                </p>
                <p className="font-bold text-gray-800 mt-2">
                  {t("Karachi Method", "করাচি পদ্ধতি")}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <p className="text-sm text-gray-500">
                  {t("Asr Calculation", "আসরের সময় গণনা")}
                </p>
                <p className="font-bold text-gray-800 mt-2">
                  {t("Hanafi School", "হানাফি মাজহাব")}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center mt-6 leading-relaxed">
              {t(
                "Prayer times are approximate. Follow your local mosque's timetable when needed.",
                "নামাজের সময় আনুমানিক। প্রয়োজনে আপনার স্থানীয় মসজিদের সময়সূচি অনুসরণ করুন।"
              )}
            </p>
          </>
        ) : null}
      </div>
    </main>
  );
}
