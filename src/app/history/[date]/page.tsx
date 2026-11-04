
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import DailyReportHTML from "@/components/DailyReportHTML";
import { getDailyReportData } from "@/lib/getDailyReportData";
import type { DailyReportData } from "@/components/DailyReportPDF";
import { useLanguage } from "@/context/LanguageContext";

const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const options = ["Not Recorded", "Jamaat", "Alone", "Missed"];

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function DayDetailsPage() {
  const { date } = useParams<{ date: string }>();
  const router = useRouter();
  const { language, t } = useLanguage();

  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [originalStatuses, setOriginalStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [reportData, setReportData] = useState<DailyReportData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [reportError, setReportError] = useState("");

  const canEdit = date <= getToday();

  useEffect(() => {
    async function loadDayDetails() {
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
          .from("prayer_logs")
          .select("prayer_name, status")
          .eq("user_id", user.id)
          .eq("prayer_date", date);

        if (error) throw error;

        const saved: Record<string, string> = {};

        prayers.forEach((prayer) => {
          saved[prayer] = "Not Recorded";
        });

        (data || []).forEach((item) => {
          saved[item.prayer_name] = item.status;
        });

        setStatuses(saved);
        setOriginalStatuses(saved);
      } catch (error) {
        console.error("Loading Error:", error);
        setMessage(
          error instanceof Error ? error.message : "Loading failed"
        );
      } finally {
        setLoading(false);
      }
    }

    loadDayDetails();
  }, [date, router]);

  async function handlePrepareReport() {
    setGenerating(true);
    setReportError("");
    setReportData(null);

    try {
      const data = await getDailyReportData(date);
      setReportData(data);
    } catch (error) {
      console.error("Report Error:", error);

      setReportError(
        error instanceof Error
          ? error.message
          : "Report could not be prepared"
      );
    } finally {
      setGenerating(false);
    }
  }

  function cancelEdit() {
    setStatuses(originalStatuses);
    setEditing(false);
    setMessage("");
  }

  async function saveChanges() {
    setSaving(true);
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

      for (const prayer of prayers) {
        const status = statuses[prayer];

        if (status === "Not Recorded") {
          const { error } = await supabase
            .from("prayer_logs")
            .delete()
            .eq("user_id", user.id)
            .eq("prayer_date", date)
            .eq("prayer_name", prayer);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("prayer_logs")
            .upsert(
              {
                user_id: user.id,
                prayer_date: date,
                prayer_name: prayer,
                status: status,
              },
              {
                onConflict: "user_id,prayer_date,prayer_name",
              }
            );

          if (error) throw error;
        }
      }

      setOriginalStatuses({ ...statuses });
      setEditing(false);
      setMessage("Changes saved successfully!");

      setReportData(null);
    } catch (error) {
      console.error("Save Error:", error);
      setMessage(
        error instanceof Error ? error.message : "Saving failed"
      );
    } finally {
      setSaving(false);
    }
  }

  const formattedDate = new Date(
    date + "T00:00:00"
  ).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function getPrayerName(prayer: string) {
    const names: Record<string, string> = {
      Fajr: t("Fajr", "ফজর"),
      Dhuhr: t("Dhuhr", "যোহর"),
      Asr: t("Asr", "আসর"),
      Maghrib: t("Maghrib", "মাগরিব"),
      Isha: t("Isha", "ইশা"),
    };

    return names[prayer] || prayer;
  }

  function getStatusName(status: string) {
    const names: Record<string, string> = {
      "Not Recorded": t("Not Recorded", "রেকর্ড করা হয়নি"),
      Jamaat: t("Jamaat", "জামাতে"),
      Alone: t("Alone", "একা"),
      Missed: t("Missed", "কাজা"),
    };

    return names[status] || status;
  }

  function getMessageText(value: string) {
    if (value === "Changes saved successfully!") {
      return t("Changes saved successfully!", "পরিবর্তন সফলভাবে সংরক্ষণ হয়েছে!");
    }

    if (value === "Loading failed") {
      return t("Loading failed", "লোড করা যায়নি");
    }

    if (value === "Saving failed") {
      return t("Saving failed", "সংরক্ষণ করা যায়নি");
    }

    return value;
  }

  function statusColor(status: string) {
    if (status === "Jamaat") return "text-green-700 bg-green-100";
    if (status === "Alone") return "text-blue-700 bg-blue-100";
    if (status === "Missed") return "text-red-700 bg-red-100";

    return "text-gray-600 bg-gray-100";
  }

  return (
    <main className="min-h-screen bg-green-50 p-6">
      <div className="max-w-3xl mx-auto">

        <Navigation />

        <header className="bg-white p-6 rounded-2xl shadow-sm">
          <h1 className="text-3xl font-bold text-green-800">
            {t("Daily Prayer Details", "দৈনিক নামাজের বিস্তারিত")}
          </h1>

          <p className="text-gray-500 mt-2">
            {formattedDate}
          </p>

          <div className="mt-5">
            <button
              onClick={handlePrepareReport}
              disabled={generating || loading}
              className="bg-green-700 text-white px-5 py-3 rounded-xl hover:bg-green-800 disabled:opacity-50"
            >
              {generating
                ? t("Preparing Report...", "রিপোর্ট তৈরি হচ্ছে...")
                : t("Prepare Daily Report", "দৈনিক রিপোর্ট তৈরি করুন")}
            </button>

            {reportError && (
              <p className="text-red-600 mt-3">
                {reportError === "Report could not be prepared"
                  ? t("Report could not be prepared", "রিপোর্ট তৈরি করা যায়নি")
                  : reportError}
              </p>
            )}
          </div>
        </header>

        <section className="bg-white p-6 rounded-2xl shadow-sm mt-6">

          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-bold text-green-900">
              {t("Five Daily Prayers", "পাঁচ ওয়াক্ত নামাজ")}
            </h2>

            {!editing && canEdit && !loading && (
              <button
                onClick={() => {
                  setEditing(true);
                  setMessage("");
                }}
                className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800"
              >
                {t("Edit Record", "রেকর্ড সম্পাদনা")}
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-center text-green-800 py-6">
              {t("Loading...", "লোড হচ্ছে...")}
            </p>
          ) : (
            <div className="space-y-4">
              {prayers.map((prayer) => {
                const status = statuses[prayer] || "Not Recorded";

                return (
                  <div
                    key={prayer}
                    className="border border-green-100 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-gray-800">
                        {getPrayerName(prayer)}
                      </span>

                      {!editing && (
                        <span
                          className={`px-3 py-2 rounded-lg text-sm font-semibold ${statusColor(status)}`}
                        >
                          {getStatusName(status)}
                        </span>
                      )}
                    </div>

                    {editing && (
                      <select
                        value={status}
                        onChange={(e) =>
                          setStatuses((previous) => ({
                            ...previous,
                            [prayer]: e.target.value,
                          }))
                        }
                        className="w-full mt-3 border border-gray-300 rounded-lg p-3 text-gray-800 bg-white"
                      >
                        {options.map((option) => (
                          <option key={option} value={option}>
                            {getStatusName(option)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {editing && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={saveChanges}
                disabled={saving}
                className="flex-1 bg-green-700 text-white py-3 rounded-xl hover:bg-green-800 disabled:opacity-50"
              >
                {saving
                  ? t("Saving...", "সংরক্ষণ হচ্ছে...")
                  : t("Save Changes", "পরিবর্তন সংরক্ষণ করুন")}
              </button>

              <button
                onClick={cancelEdit}
                disabled={saving}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl hover:bg-gray-300"
              >
                {t("Cancel", "বাতিল")}
              </button>
            </div>
          )}

          {!canEdit && (
            <p className="text-center text-gray-500 mt-5 text-sm">
              {t(
                "Future date records cannot be edited.",
                "ভবিষ্যতের তারিখের রেকর্ড সম্পাদনা করা যাবে না।"
              )}
            </p>
          )}

          {message && (
            <p className="text-center text-green-700 mt-5">
              {getMessageText(message)}
            </p>
          )}

          <button
            onClick={() => router.push("/history")}
            className="w-full mt-6 bg-gray-700 text-white py-3 rounded-xl hover:bg-gray-800"
          >
            {t("Back to Calendar", "ক্যালেন্ডারে ফিরে যান")}
          </button>

        </section>

        {reportData && (
          <DailyReportHTML report={reportData} />
        )}

      </div>
    </main>
  );
}
