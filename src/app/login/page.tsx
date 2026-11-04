
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
const handleGuestLogin = async () => {
  setLoading(true);
  setMessage("");

  try {
    const { error } = await supabase.auth.signInAnonymously();

    if (error) throw error;

    router.replace("/");
    router.refresh();
  } catch (error) {
    setMessage(
      error instanceof Error
        ? error.message
        : "Unable to continue as guest."
    );
  } finally {
    setLoading(false);
  }
};
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push("/");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          router.push("/");
          router.refresh();
        } else {
          setMessage(
            "Signup successful! Please check your email to verify your account."
          );
        }
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7f1] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute -top-24 -right-20 w-80 h-80 rounded-full bg-emerald-100/70 blur-3xl" />
      <div className="absolute -bottom-24 -left-20 w-80 h-80 rounded-full bg-green-100/70 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-7">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-900 to-teal-700 flex items-center justify-center text-4xl shadow-lg mx-auto">
            🕌
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-5">
            My Salah Tracker
          </h1>

          <p className="text-gray-500 mt-2">
            Build consistency in your daily prayers.
          </p>
        </div>

        <div className="bg-white w-full p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100">
          <div className="text-center mb-7">
            <h2 className="text-2xl font-bold text-gray-900">
              {isLogin ? "Welcome Back!" : "Create Account"}
            </h2>

            <p className="text-gray-500 text-sm mt-2">
              {isLogin
                ? "Login to continue your journey."
                : "Start your Salah tracking journey."}
            </p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl mb-7">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setMessage("");
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                isLogin
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setMessage("");
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                !isLogin
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full p-3.5 border border-gray-200 rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>

              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="w-full p-3.5 border border-gray-200 rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition"
                placeholder="Enter your password"
              />

              {!isLogin && (
                <p className="text-xs text-gray-400 mt-2">
                  Password must be at least 6 characters.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-800 to-teal-700 hover:from-emerald-900 hover:to-teal-800 text-white p-3.5 rounded-xl font-semibold shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Please wait..."
                : isLogin
                ? "Login to Account →"
                : "Create Account →"}
            </button>
          </form>
          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="px-3 text-sm text-gray-400">OR</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button
            type="button"
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full border-2 border-emerald-700 text-emerald-800 hover:bg-emerald-50 p-3.5 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue as Guest →
          </button>

          <p className="text-center text-xs text-gray-400 mt-3">
            Explore the tracker without creating an account.
          </p>
          {message && (
            <div className={`mt-5 p-4 rounded-xl text-sm text-center ${
              message.toLowerCase().includes("successful")
                ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                : "bg-red-50 text-red-700 border border-red-100"
            }`}>
              {message}
            </div>
          )}

          <div className="text-center mt-7">
            <p className="text-sm text-gray-500">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}

              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setMessage("");
                }}
                className="text-emerald-700 font-bold ml-2 hover:underline"
              >
                {isLogin ? "Sign Up" : "Login"}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          My Salah Tracker · Your daily worship companion
        </p>
      </div>
    </main>
  );
}
