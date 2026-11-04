
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [editName, setEditName] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  const [isGuest, setIsGuest] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPassword, setGuestPassword] = useState("");
  const [guestConfirmPassword, setGuestConfirmPassword] = useState("");
  const [convertingGuest, setConvertingGuest] = useState(false);
  const [guestMessage, setGuestMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      const name = data.user.user_metadata?.full_name || "";

      setIsGuest(data.user.is_anonymous === true);
      setEmail(data.user.email || "");
      setFullName(name);
      setEditName(name);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function handleSaveName() {
    const name = editName.trim();

    if (!name) {
      setMessage(t("Please enter your name.", "অনুগ্রহ করে আপনার নাম লিখুন।"));
      return;
    }

    setSaving(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      data: { full_name: name },
    });

    if (error) {
      setMessage(t("Could not update name. Please try again.", "নাম আপডেট করা যায়নি। আবার চেষ্টা করুন।"));
    } else {
      setFullName(name);
      setEditing(false);
      setMessage(t("Name updated successfully!", "নাম সফলভাবে আপডেট হয়েছে!"));
    }

    setSaving(false);
  }

  async function handleChangePassword() {
    setPasswordMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage(t("Please fill in all password fields.", "অনুগ্রহ করে পাসওয়ার্ডের সব ঘর পূরণ করুন।"));
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage(t("New password must be at least 6 characters.", "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage(t("New passwords do not match.", "নতুন পাসওয়ার্ড দুটি মিলছে না।"));
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordMessage(t("New password must be different from current password.", "নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ড থেকে আলাদা হতে হবে।"));
      return;
    }

    setChangingPassword(true);

    const { error: verifyError } =
      await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

    if (verifyError) {
      setPasswordMessage(t("Current password is incorrect.", "বর্তমান পাসওয়ার্ডটি সঠিক নয়।"));
      setChangingPassword(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setPasswordMessage(error.message);
    } else {
      setPasswordMessage(t("Password changed successfully!", "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }

    setChangingPassword(false);
  }

  async function handleGuestConversion(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setGuestMessage("");

    const cleanEmail = guestEmail.trim();

    if (!cleanEmail) {
      setGuestMessage(t("Please enter your email address.", "অনুগ্রহ করে আপনার ইমেইল ঠিকানা লিখুন।"));
      return;
    }

    if (guestPassword.length < 6) {
      setGuestMessage(t("Password must be at least 6 characters.", "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।"));
      return;
    }

    if (guestPassword !== guestConfirmPassword) {
      setGuestMessage(t("Passwords do not match.", "পাসওয়ার্ড দুটি মিলছে না।"));
      return;
    }

    setConvertingGuest(true);

    try {
      const { error } = await supabase.auth.updateUser({
        email: cleanEmail,
        password: guestPassword,
      });

      if (error) throw error;

      setGuestMessage(
        t(
          "Account details submitted! Please check your email and verify your new email address if requested.",
          "অ্যাকাউন্টের তথ্য জমা হয়েছে! আপনার ইমেইল চেক করুন এবং প্রয়োজন হলে নতুন ইমেইল ঠিকানাটি ভেরিফাই করুন।"
        )
      );

      setGuestEmail("");
      setGuestPassword("");
      setGuestConfirmPassword("");

      const { data } = await supabase.auth.getUser();

      if (data.user) {
        setEmail(data.user.email || "");
        setIsGuest(data.user.is_anonymous === true);
      }
    } catch (error) {
      setGuestMessage(
        error instanceof Error
          ? error.message
          : t("Something went wrong.", "কিছু একটা সমস্যা হয়েছে।")
      );
    } finally {
      setConvertingGuest(false);
    }
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(t("Logout failed. Please try again.", "লগআউট করা যায়নি। আবার চেষ্টা করুন।"));
      return;
    }

    router.replace("/login");
  }

  return (
    <main className="min-h-screen bg-[#f5f7f1] px-4 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto">
        <Navigation />

        <header className="mt-8 mb-7">
          <p className="text-sm font-semibold tracking-wider text-emerald-700">
            {t("ACCOUNT MANAGEMENT", "অ্যাকাউন্ট ব্যবস্থাপনা")}
          </p>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
            {t("Settings", "সেটিংস")}
          </h1>

          <p className="text-gray-500 mt-2">
            {t("Manage your profile and account security.", "আপনার প্রোফাইল ও অ্যাকাউন্টের নিরাপত্তা পরিচালনা করুন।")}
          </p>
        </header>

        {loading ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm">
            <p className="text-gray-500">{t("Loading profile...", "প্রোফাইল লোড হচ্ছে...")}</p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Account Information */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-900 to-teal-700 p-6 sm:p-8 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-3xl">
                    👤
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">
                      {t("Account Information", "অ্যাকাউন্টের তথ্য")}
                    </h2>

                    <p className="text-emerald-100 text-sm mt-1">
                      {t("Your personal account details", "আপনার ব্যক্তিগত অ্যাকাউন্টের বিবরণ")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    {t("Full Name", "পুরো নাম")}
                  </label>

                  {editing ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder={t("Enter your name", "আপনার নাম লিখুন")}
                      className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-gray-800"
                    />
                  ) : (
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 font-semibold text-gray-800">
                      {fullName || t("User", "ব্যবহারকারী")}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    {t("Email Address", "ইমেইল ঠিকানা")}
                  </label>

                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-gray-700 break-all">
                    {email || t("No email linked yet", "এখনো কোনো ইমেইল যুক্ত করা হয়নি")}
                  </div>
                </div>

                {editing ? (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleSaveName}
                      disabled={saving}
                      className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold px-6 py-3 rounded-xl transition disabled:opacity-50"
                    >
                      {saving ? t("Saving...", "সংরক্ষণ হচ্ছে...") : t("Save Changes", "পরিবর্তন সংরক্ষণ করুন")}
                    </button>

                    <button
                      onClick={() => {
                        setEditName(fullName);
                        setEditing(false);
                        setMessage("");
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl transition"
                    >
                      {t("Cancel", "বাতিল")}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditName(fullName);
                      setEditing(true);
                      setMessage("");
                    }}
                    className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold px-6 py-3 rounded-xl transition"
                  >
                    {t("Edit Profile", "প্রোফাইল সম্পাদনা")}
                  </button>
                )}

                {message && (
                  <p
                    className={`text-sm mt-4 ${
                      message.includes("successfully") || message.includes("সফলভাবে")
                        ? "text-emerald-700"
                        : "text-red-600"
                    }`}
                  >
                    {message}
                  </p>
                )}
              </div>
            </section>

            {/* Guest Account Upgrade */}
            {isGuest && (
              <section className="bg-white rounded-3xl shadow-sm border border-emerald-100 p-6 sm:p-8">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-2xl">
                    🌱
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {t("Create Permanent Account", "স্থায়ী অ্যাকাউন্ট তৈরি করুন")}
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      {t("Save your progress and access it later.", "আপনার অগ্রগতি সংরক্ষণ করুন এবং পরবর্তীতে ব্যবহার করুন।")}
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
                  <p className="text-sm text-emerald-800">
                    {t(
                      "Upgrade your Guest Account to a permanent account. Your existing prayer, amal and Quran records will remain connected to the same account.",
                      "আপনার গেস্ট অ্যাকাউন্টকে স্থায়ী অ্যাকাউন্টে রূপান্তর করুন। আপনার আগের নামাজ, আমল ও কুরআনের রেকর্ড একই অ্যাকাউন্টে সংরক্ষিত থাকবে।"
                    )}
                  </p>
                </div>

                <form
                  onSubmit={handleGuestConversion}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      {t("Email Address", "ইমেইল ঠিকানা")}
                    </label>

                    <input
                      type="email"
                      required
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder={t("Enter your email", "আপনার ইমেইল লিখুন")}
                      autoComplete="email"
                      className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-600 text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      {t("Password", "পাসওয়ার্ড")}
                    </label>

                    <input
                      type="password"
                      required
                      minLength={6}
                      value={guestPassword}
                      onChange={(e) => setGuestPassword(e.target.value)}
                      placeholder={t("Create a password", "একটি পাসওয়ার্ড তৈরি করুন")}
                      autoComplete="new-password"
                      className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-600 text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">
                      {t("Confirm Password", "পাসওয়ার্ড নিশ্চিত করুন")}
                    </label>

                    <input
                      type="password"
                      required
                      minLength={6}
                      value={guestConfirmPassword}
                      onChange={(e) => setGuestConfirmPassword(e.target.value)}
                      placeholder={t("Confirm your password", "আবার পাসওয়ার্ড লিখুন")}
                      autoComplete="new-password"
                      className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-600 text-gray-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={convertingGuest}
                    className="w-full bg-gradient-to-r from-emerald-800 to-teal-700 hover:from-emerald-900 hover:to-teal-800 text-white font-semibold p-3.5 rounded-xl shadow-md transition disabled:opacity-50"
                  >
                    {convertingGuest
                      ? t("Creating Account...", "অ্যাকাউন্ট তৈরি হচ্ছে...")
                      : t("Upgrade to Permanent Account →", "স্থায়ী অ্যাকাউন্টে রূপান্তর করুন →")}
                  </button>
                </form>

                {guestMessage && (
                  <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm">
                    {guestMessage}
                  </div>
                )}
              </section>
            )}

            {/* Change Password */}
            {!isGuest && (
              <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl">
                    🔒
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {t("Change Password", "পাসওয়ার্ড পরিবর্তন")}
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      {t("Keep your account secure.", "আপনার অ্যাকাউন্ট নিরাপদ রাখুন।")}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      {t("Current Password", "বর্তমান পাসওয়ার্ড")}
                    </label>

                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t("Enter current password", "বর্তমান পাসওয়ার্ড লিখুন")}
                      autoComplete="current-password"
                      className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      {t("New Password", "নতুন পাসওয়ার্ড")}
                    </label>

                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t("Enter new password", "নতুন পাসওয়ার্ড লিখুন")}
                      autoComplete="new-password"
                      className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      {t("Confirm New Password", "নতুন পাসওয়ার্ড নিশ্চিত করুন")}
                    </label>

                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t("Confirm new password", "নতুন পাসওয়ার্ড আবার লিখুন")}
                      autoComplete="new-password"
                      className="w-full border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-semibold px-6 py-3 rounded-xl mt-5 transition disabled:opacity-50"
                >
                  {changingPassword
                    ? t("Changing...", "পরিবর্তন হচ্ছে...")
                    : t("Update Password", "পাসওয়ার্ড আপডেট করুন")}
                </button>

                {passwordMessage && (
                  <p
                    className={`text-sm mt-4 break-words ${
                      passwordMessage.includes("successfully") || passwordMessage.includes("সফলভাবে")
                        ? "text-emerald-700"
                        : "text-red-600"
                    }`}
                  >
                    {passwordMessage}
                  </p>
                )}
              </section>
            )}

            {/* Logout */}
            <section className="bg-white rounded-3xl border border-red-100 shadow-sm p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {t("Sign Out", "সাইন আউট")}
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    {t("Sign out of your Namaz Tracker account.", "আপনার নামাজ ট্র্যাকার অ্যাকাউন্ট থেকে বের হয়ে যান।")}
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition"
                >
                  {t("Logout", "লগআউট")}
                </button>
              </div>
            </section>

            <p className="text-center text-xs text-gray-400 pb-4">
              Namaz Tracker · {t("Account Settings", "অ্যাকাউন্ট সেটিংস")}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
