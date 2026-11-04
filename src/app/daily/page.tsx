
"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import { dailyContent } from "@/lib/dailyContent";
import { useLanguage } from "@/context/LanguageContext";

function getDateIndex() {
  const dayNumber = new Date().getDate();
  return (dayNumber - 1) % dailyContent.length;
}

export default function DailyPage() {
  const { language, t } = useLanguage();

  const [dayIndex, setDayIndex] = useState<number | null>(null);
  const [today, setToday] = useState("");

  useEffect(() => {
    const currentDate = new Date();

    setDayIndex(getDateIndex());

    setToday(
      currentDate.toLocaleDateString(
        language === "bn" ? "bn-BD" : "en-US",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      )
    );
  }, [language]);

  if (dayIndex === null) {
    return (
      <main className="min-h-screen bg-[#f5f7f1] p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <Navigation />
          <div className="mt-10 bg-white rounded-3xl p-10 text-center shadow-sm">
            <div className="text-4xl mb-3">📖</div>
            <p className="text-emerald-800 font-medium">
              {t("Loading...", "লোড হচ্ছে...")}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const content = dailyContent[dayIndex];

  return (
    <main className="min-h-screen bg-[#f5f7f1] px-4 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto">
        <Navigation />

        <header className="mt-8 mb-7">
          <p className="text-sm font-semibold tracking-wider text-emerald-700">
            {t("DAILY REMINDER", "দৈনিক স্মরণিকা")}
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
            {t("Daily Hadith & Ayah", "দৈনিক হাদিস ও আয়াত")}
          </h1>

          <p className="text-gray-500 mt-2">
            {t(
              "A daily verse and a Hadith",
              "প্রতিদিন একটি আয়াত ও একটি হাদিস"
            )}
          </p>
        </header>

        {/* Daily Reminder Banner */}
        <section className="bg-gradient-to-br from-emerald-900 via-green-800 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="text-emerald-200 text-sm font-medium">
                {t(
                  "TODAY'S ISLAMIC REMINDER",
                  "আজকের ইসলামিক স্মরণিকা"
                )}
              </p>

              <h2 className="text-2xl sm:text-3xl font-bold mt-2">
                {t(
                  `Day ${dayIndex + 1} of 30`,
                  `৩০ দিনের ${dayIndex + 1}তম দিন`
                )}
              </h2>

              <p className="text-emerald-100 mt-2">{today}</p>
            </div>

            <div className="bg-white/10 border border-white/10 rounded-2xl p-4 text-center min-w-[90px]">
              <p className="text-3xl">🕌</p>
              <p className="text-xs text-emerald-100 mt-2">
                {t("Daily Reminder", "দৈনিক স্মরণিকা")}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-xs text-emerald-100 mb-2">
              <span>
                {t("Monthly journey", "মাসিক অগ্রগতি")}
              </span>
              <span>
                {Math.round(((dayIndex + 1) / 30) * 100)}%
              </span>
            </div>

            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{
                  width: `${((dayIndex + 1) / 30) * 100}%`,
                }}
              />
            </div>
          </div>
        </section>

        {/* Ayah and Hadith */}
        <div className="grid md:grid-cols-2 gap-5">

          {/* Ayah Card */}
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-emerald-50 px-6 py-5 border-b border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm">
                  📖
                </div>

                <div>
                  <p className="text-xs font-semibold text-emerald-700 tracking-wider">
                    {t("QURAN", "আল-কুরআন")}
                  </p>

                  <h2 className="text-lg font-bold text-emerald-950">
                    {t("Ayah of the Day", "আজকের আয়াত")}
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-xl sm:text-2xl font-semibold text-gray-800 leading-[2.2]">
                {content.ayahBn}
              </p>

              <div className="mt-6 pt-5 border-t border-gray-100">
                <p className="text-sm font-semibold text-emerald-800">
                  {content.ayahRef}
                </p>

                <p className="text-xs text-gray-400 mt-2">
                  {t("Bangla Meaning", "বাংলা ভাবার্থ")}
                </p>

                <a
                  href="https://quran.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
                >
                  {t("View Original Ayah", "মূল আয়াত দেখুন")}
                  <span>↗</span>
                </a>
              </div>
            </div>
          </section>

          {/* Hadith Card */}
          <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-amber-50 px-6 py-5 border-b border-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm">
                  ☪️
                </div>

                <div>
                  <p className="text-xs font-semibold text-amber-700 tracking-wider">
                    {t("HADITH", "হাদিস")}
                  </p>

                  <h2 className="text-lg font-bold text-amber-950">
                    {t("Hadith of the Day", "আজকের হাদিস")}
                  </h2>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-xl sm:text-2xl font-semibold text-gray-800 leading-[2.2]">
                {content.hadithBn}
              </p>

              <div className="mt-6 pt-5 border-t border-gray-100">
                <p className="text-sm font-semibold text-amber-800">
                  {content.hadithRef}
                </p>

                <p className="text-xs text-gray-400 mt-2">
                  {t("Hadith Meaning", "হাদিসের সংক্ষিপ্ত অর্থ")}
                </p>

                <a
                  href="https://sunnah.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-900 hover:underline"
                >
                  {t("View Original Hadith", "মূল হাদিস দেখুন")}
                  <span>↗</span>
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Daily Inspiration */}
        <div className="mt-6 bg-white rounded-2xl p-5 border border-gray-100 text-center shadow-sm">
          <p className="text-2xl mb-2">🌿</p>

          <p className="font-semibold text-gray-800">
            {t(
              "Read, understand, and try to practice.",
              "পড়ুন, বুঝুন এবং জীবনে আমল করার চেষ্টা করুন।"
            )}
          </p>

          <p className="text-sm text-gray-500 mt-2">
            {t(
              "May a small daily lesson make your life better.",
              "প্রতিদিনের ছোট্ট শিক্ষা আপনার জীবনকে সুন্দর করে তুলুক।"
            )}
          </p>
        </div>

      </div>
    </main>
  );
}
