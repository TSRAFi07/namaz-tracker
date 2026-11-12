
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

const navItems = [
  { name: "Dashboard", bn: "ড্যাশবোর্ড", path: "/", icon: "⌂" },
  { name: "Daily Amals", bn: "দৈনিক আমল", path: "/amals", icon: "♡" },
  { name: "History", bn: "ইতিহাস", path: "/history", icon: "▦" },
  {
    name: "Monthly Report",
    bn: "মাসিক রিপোর্ট",
    path: "/monthly-report",
    icon: "📊",
  },
  { name: "Quran Tracker", bn: "কুরআন ট্র্যাকার", path: "/quran", icon: "☪" },
  { name: "Prayer Times", bn: "নামাজের সময়", path: "/prayer-times", icon: "◷" },
  {
    name: "Daily Hadith & Ayah",
    bn: "দৈনিক হাদিস ও আয়াত",
    path: "/daily",
    icon: "📖",
  },
  { name: "Settings", bn: "সেটিংস", path: "/settings", icon: "⚙" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav className="w-full bg-white shadow-sm border border-green-100 rounded-2xl p-2 sm:p-3 mb-6">

      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <span className="text-xs sm:text-sm font-semibold text-gray-500">
          {t("Select Language", "ভাষা নির্বাচন করুন")}
        </span>

        <div className="flex items-center gap-1 bg-green-50 p-1 rounded-xl">
          <button
            onClick={() => setLanguage("en")}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              language === "en"
                ? "bg-green-800 text-white"
                : "text-gray-600 hover:bg-green-100"
            }`}
          >
            English
          </button>

          <button
            onClick={() => setLanguage("bn")}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
              language === "bn"
                ? "bg-green-800 text-white"
                : "text-gray-600 hover:bg-green-100"
            }`}
          >
            বাংলা
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-green-800 text-white font-semibold"
        >
          <span>☰ {t("Menu", "মেনু")}</span>
          <span>{menuOpen ? "▲" : "▼"}</span>
        </button>

        {menuOpen && (
          <div className="flex flex-col gap-2 mt-3">
            {navItems.map((item) => {
              const active = pathname === item.path;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition ${
                    active
                      ? "bg-green-800 text-white"
                      : "text-gray-600 hover:bg-green-50"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>
                    {language === "bn" ? item.bn : item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-8 md:gap-1">
        {navItems.map((item) => {
          const active = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              title={language === "bn" ? item.bn : item.name}
              className={`min-w-0 flex flex-col xl:flex-row items-center justify-center gap-1 xl:gap-2 px-1 xl:px-2 py-3 rounded-xl font-semibold text-center transition ${
                active
                  ? "bg-green-800 text-white"
                  : "text-gray-600 hover:bg-green-50"
              }`}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              <span className="text-[10px] lg:text-xs xl:text-sm leading-tight">
                {language === "bn" ? item.bn : item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
