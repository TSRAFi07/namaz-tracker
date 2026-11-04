"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navigation from "@/components/Navigation";
import { useLanguage } from "@/context/LanguageContext";

const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

const prayerNamesBn: Record<string, string> = {
Fajr: "ফজর",
Dhuhr: "যোহর",
Asr: "আসর",
Maghrib: "মাগরিব",
Isha: "ইশা",
};

const prayerIcons: Record<string, string> = {
Fajr: "🌅",
Dhuhr: "☀️",
Asr: "🌤️",
Maghrib: "🌇",
Isha: "🌙",
};

type PrayerLog = {
prayer_date: string;
prayer_name: string;
status: string;
};

function getToday() {
const date = new Date();
return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDateString(date: Date) {
return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getPreviousDate(dateString: string) {
const [year, month, day] = dateString.split("-").map(Number);
const date = new Date(year, month - 1, day - 1);
return getDateString(date);
}

function calculateStreak(dates: string[]) {
const completedDates = new Set(dates);
const sortedDates = [...completedDates].sort();

let best = 0;
let current = 0;
let previous = "";

for (const date of sortedDates) {
if (previous && getPreviousDate(date) === previous) {
current++;
} else {
current = 1;
}

best = Math.max(best, current);
previous = date;
}

const today = getToday();
const startDate = completedDates.has(today)
? today
: getPreviousDate(today);

let streak = 0;
let checkDate = startDate;

while (completedDates.has(checkDate)) {
streak++;
checkDate = getPreviousDate(checkDate);
}

return { current: streak, best };
}

function calculateWeekly(logs: PrayerLog[], language: string) {
const today = new Date();
const result = [];

const weekdaysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekdaysBn = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];

for (let i = 6; i >= 0; i--) {
const date = new Date(
today.getFullYear(),
today.getMonth(),
today.getDate() - i
);

const dateKey = getDateString(date);

const completedNames = new Set(
logs
.filter(
(log) =>
log.prayer_date === dateKey &&
(log.status === "Jamaat" || log.status === "Alone")
)
.map((log) => log.prayer_name)
);

result.push({
date: dateKey,
day: language === "bn"
? weekdaysBn[date.getDay()]
: weekdaysEn[date.getDay()],
count: prayers.filter((prayer) => completedNames.has(prayer)).length,
});
}

return result;
}

export default function Home() {
const router = useRouter();
const { language, t } = useLanguage();

const [userName, setUserName] = useState("User");
const [status, setStatus] = useState<string[]>(["", "", "", "", ""]);
const [completedAmals, setCompletedAmals] = useState(0);
const [streak, setStreak] = useState({ current: 0, best: 0 });
const [weeklyData, setWeeklyData] = useState<
{ date: string; day: string; count: number }[]
>([]);
const [loading, setLoading] = useState(true);
const [message, setMessage] = useState("");
const [dateInfo, setDateInfo] = useState<{
englishDate: string;
hijriDate: string;
arabicDay: string;
} | null>(null);

useEffect(() => {
const today = new Date();
const timeZone = "Asia/Dhaka";

setDateInfo({
englishDate: new Intl.DateTimeFormat("en-GB", {
weekday: "long",
day: "numeric",
month: "long",
year: "numeric",
timeZone,
}).format(today),
hijriDate: new Intl.DateTimeFormat(
"ar-SA-u-ca-islamic-umalqura-nu-arab",
{
day: "numeric",
month: "long",
year: "numeric",
timeZone,
}
).format(today),
arabicDay: new Intl.DateTimeFormat("ar-SA", {
weekday: "long",
timeZone,
}).format(today),
});
}, []);

const completed = status.filter(
(s) => s === "Jamaat" || s === "Alone"
).length;

const recorded = status.filter((s) => s !== "");

const weeklyTotal = weeklyData.reduce((sum, day) => sum + day.count, 0);
const weeklyPercentage = Math.round((weeklyTotal / 35) * 100);

const bestDay = weeklyData.reduce(
(best, day) => day.count > best.count ? day : best,
{ date: "", day: "-", count: 0 }
);

const progressPercentage = (completed / 5) * 100;
const amalPercentage = (completedAmals / 6) * 100;

useEffect(() => {
async function loadPrayers() {
try {
const {
data: { user },
error: authError,
} = await supabase.auth.getUser();

if (authError || !user) {
router.replace("/login");
return;
}

setUserName(user.user_metadata?.full_name || "User");

const { data, error } = await supabase
.from("prayer_logs")
.select("prayer_name, status")
.eq("user_id", user.id)
.eq("prayer_date", getToday());

if (error) throw error;

const updated = ["", "", "", "", ""];

(data || []).forEach((item) => {
const index = prayers.indexOf(item.prayer_name);
if (index !== -1) updated[index] = item.status;
});

setStatus(updated);

const { data: allLogs, error: streakError } = await supabase
.from("prayer_logs")
.select("prayer_date, prayer_name, status")
.eq("user_id", user.id)
.lte("prayer_date", getToday());

if (streakError) throw streakError;

const logs: PrayerLog[] = allLogs || [];
const dailyRecords: Record<string, Set<string>> = {};

logs.forEach((item) => {
if (
item.status !== "Jamaat" &&
item.status !== "Alone"
) return;

if (!dailyRecords[item.prayer_date]) {
dailyRecords[item.prayer_date] = new Set();
}

dailyRecords[item.prayer_date].add(item.prayer_name);
});

const completedDates = Object.keys(dailyRecords).filter(
(date) => prayers.every((prayer) => dailyRecords[date].has(prayer))
);

setStreak(calculateStreak(completedDates));
setWeeklyData(calculateWeekly(logs, language));

const { data: amalData, error: amalError } = await supabase
.from("daily_amals")
.select("completed")
.eq("user_id", user.id)
.eq("amal_date", getToday())
.eq("completed", true);

if (amalError) throw amalError;

setCompletedAmals(amalData.length);

} catch (error) {
console.error("Loading Error:", error);
setMessage(
error instanceof Error ? error.message : t("Loading failed", "লোড করা যায়নি")
);
} finally {
setLoading(false);
}
}

loadPrayers();
}, [router, language, t]);

async function updatePrayer(index: number, value: string) {
const previousStatus = status[index];

const updated = [...status];
updated[index] = value;
setStatus(updated);
setMessage(t("Saving...", "সংরক্ষণ হচ্ছে..."));

try {
const { data, error: authError } = await supabase.auth.getUser();

if (authError) throw authError;

const user = data.user;

if (!user) {
setMessage(t("User not logged in. Please login again.", "ব্যবহারকারী লগইন করা নেই। আবার লগইন করুন।"));
router.replace("/login");
return;
}

const prayerName = prayers[index];

const { error } = await supabase
.from("prayer_logs")
.upsert(
{
user_id: user.id,
prayer_date: getToday(),
prayer_name: prayerName,
status: value,
updated_at: new Date().toISOString(),
},
{
onConflict: "user_id,prayer_date,prayer_name",
}
);

if (error) throw error;

const { data: allLogs, error: streakError } = await supabase
.from("prayer_logs")
.select("prayer_date, prayer_name, status")
.eq("user_id", user.id)
.lte("prayer_date", getToday());

if (streakError) throw streakError;

const logs: PrayerLog[] = allLogs || [];
const dailyRecords: Record<string, Set<string>> = {};

logs.forEach((item) => {
if (
item.status !== "Jamaat" &&
item.status !== "Alone"
) return;

if (!dailyRecords[item.prayer_date]) {
dailyRecords[item.prayer_date] = new Set();
}

dailyRecords[item.prayer_date].add(item.prayer_name);
});

const completedDates = Object.keys(dailyRecords).filter(
(date) => prayers.every((prayer) => dailyRecords[date].has(prayer))
);

setStreak(calculateStreak(completedDates));
setWeeklyData(calculateWeekly(logs, language));
setMessage(t("Prayer status saved successfully!", "নামাজের অবস্থা সফলভাবে সংরক্ষিত হয়েছে!"));

} catch (error) {
console.error("Prayer Save Error:", error);

setStatus((previous) => {
const reverted = [...previous];
reverted[index] = previousStatus;
return reverted;
});

setMessage(
error instanceof Error ? error.message : t("Unknown error occurred", "অজানা সমস্যা হয়েছে")
);
}
}

async function handleLogout() {
const { error } = await supabase.auth.signOut();

if (error) {
setMessage(error.message);
return;
}

router.replace("/login");
router.refresh();
}

if (loading) {
return (
<main className="min-h-screen flex items-center justify-center bg-[#f5f7f1]">
<div className="text-center">
<div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-800 rounded-full animate-spin mx-auto mb-4" />
<p className="text-emerald-900 font-semibold">
{t("Loading your dashboard...", "আপনার ড্যাশবোর্ড লোড হচ্ছে...")}
</p>
</div>
</main>
);
}

return (
<main className="min-h-screen bg-[#f5f7f1] text-slate-800">
<div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-8">

<Navigation />

{/* Top Header */}
<header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 mb-6">
<div>
<p className="text-sm font-semibold tracking-widest text-emerald-700 uppercase">
{t("Personal Islamic Dashboard", "ব্যক্তিগত ইসলামিক ড্যাশবোর্ড")}
</p>
<h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
{t("My Salah Tracker", "আমার নামাজ ট্র্যাকার")}
</h1>
<p className="text-sm text-slate-500 mt-1">
{t("Build consistency, one prayer at a time.", "প্রতিটি নামাজের মাধ্যমে নিয়মিত হওয়ার অভ্যাস গড়ে তুলুন।")}
</p>
</div>

<button
onClick={handleLogout}
className="self-start sm:self-auto flex items-center gap-2 border border-red-200 bg-white text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-xl font-semibold transition"
>
<span>↪</span> {t("Logout", "লগআউট")}
</button>
</header>

{/* Welcome Banner */}
<section className="relative overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#065f46] to-[#047857] text-white rounded-3xl p-6 sm:p-9 mb-6 shadow-lg shadow-emerald-900/10">
<div className="absolute -right-10 -top-16 w-64 h-64 rounded-full border border-white/10" />
<div className="absolute -right-2 -top-8 w-48 h-48 rounded-full border border-white/10" />
<div className="absolute right-12 bottom-[-90px] w-56 h-56 rounded-full bg-white/5" />

<div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-8">
<div className="max-w-xl">
<p className="text-emerald-100 text-sm font-medium">
{t("Assalamu Alaikum", "আসসালামু আলাইকুম")}, {userName} 🌙
</p>

<div className="mt-4 space-y-2">
<p className="text-sm sm:text-base font-medium text-emerald-50">
{dateInfo?.englishDate || ""}
</p>
<p className="text-xl sm:text-2xl font-semibold text-white" dir="rtl">
{dateInfo?.hijriDate || ""}
</p>
</div>

<div className="mt-6 inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2 text-sm">
<span>🕌</span>
<span>
{recorded.length === 5
? t(
"All five prayer statuses recorded today.",
"আজকের পাঁচ ওয়াক্ত নামাজের হিসাব দেওয়া হয়েছে।"
)
: language === "bn"
? `আর ${5 - recorded.length} ওয়াক্ত নামাজের হিসাব দেওয়া বাকি`
: `${5 - recorded.length} prayer statuses left to record today`}
</span>
</div>
</div>

{/* Circular Progress */}
<div className="flex items-center gap-5 self-start md:self-auto bg-white/10 border border-white/15 rounded-2xl p-4 sm:p-5 backdrop-blur-sm">
<div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0">
<svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
<circle cx="60" cy="60" r="49" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="9" />
<circle
cx="60" cy="60" r="49" fill="none" stroke="white"
strokeWidth="9" strokeLinecap="round"
strokeDasharray={`${(progressPercentage / 100) * 307.9} 307.9`}
className="transition-all duration-700"
/>
</svg>
<div className="absolute inset-0 flex flex-col items-center justify-center">
<span className="text-2xl font-bold">{Math.round(progressPercentage)}%</span>
<span className="text-[10px] text-emerald-100">
{t("Completed", "সম্পন্ন")}
</span>
</div>
</div>

<div>
<p className="text-3xl font-bold">
{completed}<span className="text-emerald-200 text-xl">/5</span>
</p>
<p className="text-sm text-emerald-100 mt-1">
{t("Today's Prayers", "আজকের নামাজ")}
</p>
</div>
</div>
</div>
</section>

{/* Streak Cards */}
<section className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
<div className="bg-white rounded-2xl border border-orange-100 p-5 sm:p-6 shadow-sm hover:shadow-md transition">
<div className="flex justify-between items-start">
<div>
<p className="text-sm text-slate-500 font-medium">
{t("Current Streak", "বর্তমান ধারাবাহিকতা")}
</p>
<p className="text-3xl font-bold text-slate-900 mt-2">
{streak.current} <span className="text-base font-semibold text-slate-500">{t("Days", "দিন")}</span>
</p>
<p className="text-xs text-slate-400 mt-2">
{t("Consecutive days with all five prayers.", "টানা পাঁচ ওয়াক্ত নামাজ সম্পন্ন করার দিন।")}
</p>
</div>
<div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl">🔥</div>
</div>
</div>

<div className="bg-white rounded-2xl border border-amber-100 p-5 sm:p-6 shadow-sm hover:shadow-md transition">
<div className="flex justify-between items-start">
<div>
<p className="text-sm text-slate-500 font-medium">
{t("Best Streak", "সর্বোচ্চ ধারাবাহিকতা")}
</p>
<p className="text-3xl font-bold text-slate-900 mt-2">
{streak.best} <span className="text-base font-semibold text-slate-500">{t("Days", "দিন")}</span>
</p>
<p className="text-xs text-slate-400 mt-2">
{t("Your longest completed prayer streak.", "আপনার সবচেয়ে দীর্ঘ নামাজের ধারাবাহিকতা।")}
</p>
</div>
<div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl">🏆</div>
</div>
</div>
</section>

{/* Quran Verse Card */}
<section className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-green-50 p-5 sm:p-7 shadow-sm mb-6">
<div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-100/40" />

<div className="relative">
<div className="flex items-center gap-2 mb-4">
<span className="text-2xl">📖</span>
<h2 className="text-lg sm:text-xl font-bold text-emerald-900">
{t("A Message from the Quran", "কুরআনের বাণী")}
</h2>
</div>

<p className="text-sm font-semibold text-emerald-700 mb-5">
{t("Surah Al-Ankabut (29:45)", "সূরা আল-আনকাবুত (২৯:৪৫)")}
</p>

<p
dir="rtl"
lang="ar"
className="text-2xl sm:text-3xl leading-[2.2] text-emerald-950 text-right font-medium mb-6"
>
اتْلُ مَا أُوحِيَ إِلَيْكَ مِنَ الْكِتَابِ وَأَقِمِ الصَّلَاةَ ۖ إِنَّ
الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ ۗ وَلَذِكْرُ اللَّهِ
أَكْبَرُ ۗ وَاللَّهُ يَعْلَمُ مَا تَصْنَعُونَ
</p>

<div className="border-t border-emerald-100 pt-4">
<h3 className="text-sm font-bold text-emerald-800 mb-2">
{t("Bangla Translation", "বাংলা অনুবাদ")}
</h3>

<p className="text-sm sm:text-base leading-8 text-gray-700">
{t(
"Recite what has been revealed to you of the Book and establish prayer. Indeed, prayer restrains from immorality and wrongdoing, and the remembrance of Allah is greater. And Allah knows what you do.",
"আপনার প্রতি যে কিতাব প্রত্যাদেশ করা হয়েছে তা পাঠ করুন এবং নামাজ কায়েম করুন। নিশ্চয়ই নামাজ অশ্লীল ও মন্দ কাজ থেকে বিরত রাখে। আর আল্লাহর স্মরণই সর্বশ্রেষ্ঠ। তোমরা যা কিছু কর, আল্লাহ তা জানেন।"
)}
</p>
</div>

<p className="text-xs text-emerald-600 text-right mt-4 font-medium">
Quran · 29:45
</p>
</div>
</section>

{/* Weekly Progress */}
<section className="bg-white rounded-2xl border border-emerald-100 p-5 sm:p-7 shadow-sm mb-6">
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
<div>
<h2 className="text-lg sm:text-xl font-bold text-slate-900">
{t("Weekly Prayer Progress", "সাপ্তাহিক নামাজের অগ্রগতি")}
</h2>
<p className="text-sm text-slate-500 mt-1">
{t("Your recorded prayers over the last 7 days.", "গত ৭ দিনের নামাজের হিসাব।")}
</p>
</div>
<div className="bg-emerald-50 text-emerald-800 rounded-xl px-4 py-2">
<span className="text-xl font-bold">{weeklyPercentage}%</span>
<span className="text-xs ml-2">{t("Weekly", "সাপ্তাহিক")}</span>
</div>
</div>

<div className="grid grid-cols-7 gap-2 sm:gap-4">
{weeklyData.map((day) => (
<div key={day.date} className="text-center">
<p className="text-[11px] sm:text-sm text-slate-500 font-medium mb-3">{day.day}</p>
<div className="h-28 sm:h-36 bg-slate-50 rounded-xl flex flex-col justify-end p-1.5 sm:p-2 overflow-hidden">
<div
className="w-full bg-gradient-to-t from-emerald-700 to-emerald-400 rounded-lg transition-all duration-500"
style={{ height: `${Math.max(day.count * 20, 4)}%` }}
/>
</div>
<p className="text-xs sm:text-sm font-bold text-slate-700 mt-2">{day.count}/5</p>
</div>
))}
</div>

<div className="grid grid-cols-2 gap-3 mt-6">
<div className="rounded-xl bg-emerald-50 p-4">
<p className="text-xs sm:text-sm text-slate-500">{t("Total Prayers", "মোট নামাজ")}</p>
<p className="text-2xl font-bold text-emerald-800 mt-1">
{weeklyTotal}<span className="text-sm font-medium text-slate-500"> / 35</span>
</p>
</div>
<div className="rounded-xl bg-amber-50 p-4">
<p className="text-xs sm:text-sm text-slate-500">{t("Best Day", "সেরা দিন")}</p>
<p className="text-xl font-bold text-amber-800 mt-1">
{bestDay.day} <span className="text-sm font-medium">({bestDay.count}/5)</span>
</p>
</div>
</div>
</section>

{/* Amal Progress */}
<section className="bg-gradient-to-r from-[#ecfdf5] to-[#f0fdf4] border border-emerald-100 rounded-2xl p-5 sm:p-7 mb-8">
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
<div className="flex-1">
<div className="flex items-center gap-2">
<span className="text-2xl">✨</span>
<h2 className="text-lg sm:text-xl font-bold text-emerald-950">
{t("Today's Amal Progress", "আজকের আমলের অগ্রগতি")}
</h2>
</div>
<p className="text-sm text-slate-600 mt-2">
{language === "bn"
? `৬টি আমলের মধ্যে ${completedAmals}টি সম্পন্ন হয়েছে।`
: `${completedAmals} out of 6 daily Amals completed.`}
</p>
<div className="w-full bg-white h-3 rounded-full mt-4 overflow-hidden">
<div className="bg-emerald-700 h-3 rounded-full transition-all duration-500" style={{ width: `${amalPercentage}%` }} />
</div>
</div>
<div className="sm:min-w-32 text-center">
<p className="text-3xl font-bold text-emerald-900">{Math.round(amalPercentage)}%</p>
<button
onClick={() => router.push("/amals")}
className="mt-3 w-full bg-emerald-800 hover:bg-emerald-900 text-white px-5 py-3 rounded-xl font-semibold text-sm transition"
>
{t("Open Amals →", "আমল দেখুন →")}
</button>
</div>
</div>
</section>

{/* Prayer Tracker */}
<section className="mb-8">
<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
<div>
<p className="text-xs uppercase tracking-widest text-emerald-700 font-bold">
{t("Daily Worship", "দৈনিক ইবাদত")}
</p>
<h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
{t("Today's Prayers", "আজকের নামাজ")}
</h2>
<p className="text-sm text-slate-500 mt-1">
{t("Select the status of each prayer.", "প্রতিটি নামাজের অবস্থা নির্বাচন করুন।")}
</p>
</div>
<p className="text-sm font-semibold text-emerald-800">
{language === "bn"
? `৫টির মধ্যে ${recorded.length}টি রেকর্ড করা হয়েছে`
: `${recorded.length} of 5 recorded`}
</p>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
{prayers.map((prayer, index) => {
const selected = status[index];

const translatedStatus =
selected === "Jamaat"
? t("Jamaat", "জামাতে")
: selected === "Alone"
? t("Alone", "একা")
: selected === "Missed"
? t("Missed", "অনাদায়ী")
: "";

return (
<div
key={prayer}
className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition ${
selected === "Jamaat"
? "border-emerald-300"
: selected === "Alone"
? "border-sky-200"
: selected === "Missed"
? "border-rose-200"
: "border-slate-200"
}`}
>
<div className="flex items-center justify-between mb-5">
<div className="flex items-center gap-3">
<div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl">
{prayerIcons[prayer]}
</div>
<div>
<h3 className="font-bold text-lg text-slate-900">
{language === "bn" ? prayerNamesBn[prayer] : prayer}
</h3>
<p className="text-xs text-slate-500">{t("Daily Prayer", "দৈনিক নামাজ")}</p>
</div>
</div>
{selected && (
<span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
selected === "Jamaat"
? "bg-emerald-100 text-emerald-800"
: selected === "Alone"
? "bg-sky-100 text-sky-800"
: "bg-rose-100 text-rose-700"
}`}>
{translatedStatus}
</span>
)}
</div>

<label className="block text-xs font-semibold text-slate-500 mb-2">
{t("Prayer Status", "নামাজের অবস্থা")}
</label>
<select
value={selected}
onChange={(e) => updatePrayer(index, e.target.value)}
className="w-full mt-1 p-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
>
<option value="">{t("Select Status", "অবস্থা নির্বাচন করুন")}</option>
<option value="Jamaat">{t("Jamaat", "জামাতে")}</option>
<option value="Alone">{t("Alone", "একা")}</option>
<option value="Missed">{t("Missed", "অনাদায়ী")}</option>
</select>
</div>
);
})}
</div>
</section>

{/* Message */}
{message && (
<div className={`rounded-xl px-4 py-3 text-sm text-center mb-6 ${
message === t("Saving...", "সংরক্ষণ হচ্ছে...")
? "bg-amber-50 text-amber-800"
: message.includes("successfully") || message.includes("সংরক্ষিত")
? "bg-emerald-50 text-emerald-800"
: "bg-rose-50 text-rose-700"
}`}>
{message}
</div>
)}

<footer className="border-t border-slate-200 pt-6 pb-3">
<div className="max-w-3xl mx-auto bg-white border border-emerald-100 rounded-2xl p-5 sm:p-7 text-center shadow-sm">
<p className="text-xs font-bold tracking-widest uppercase text-emerald-700">
{t("A Reminder About Salah", "নামাজ সম্পর্কে স্মরণিকা")}
</p>
<h2 className="text-lg sm:text-xl font-bold text-emerald-950 mt-2">
{t("Salah is a pillar of Islam", "নামাজ ইসলামের অন্যতম স্তম্ভ")}
</h2>
<p className="text-xl sm:text-2xl leading-loose text-slate-800 mt-3" dir="rtl">
بُنِيَ الْإِسْلَامُ عَلَى خَمْسٍ ... وَإِقَامِ الصَّلَاةِ
</p>
<p className="text-sm sm:text-base text-slate-600 leading-relaxed mt-3">
{t(
"Islam is built upon five pillars, including establishing prayer.",
"ইসলাম পাঁচটি স্তম্ভের ওপর প্রতিষ্ঠিত, যার মধ্যে নামাজ প্রতিষ্ঠা করাও রয়েছে।"
)}
</p>
<p className="text-xs font-semibold text-emerald-700 mt-3">
{t("Sahih al-Bukhari 8 · Sahih Muslim 16", "সহিহ বুখারি ৮ · সহিহ মুসলিম ১৬")}
</p>
</div>
<p className="text-center text-xs text-slate-400 mt-5">© 2026 My Salah Tracker</p>
</footer>

</div>
</main>
);
}