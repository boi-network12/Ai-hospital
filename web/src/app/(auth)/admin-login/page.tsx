"use client";

import { DotBackgroundDemo } from "@/UI/DotBackgroundDemo";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Mail, Lock, LogIn } from "lucide-react";
import { useAuth } from "@/Hooks/authHooks";

export default function AdminLogin() {
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Validate secret
  useEffect(() => {
    const secret = searchParams.get("secret");
    if (!secret || secret !== process.env.NEXT_PUBLIC_ADMIN_SECRET) {
      router.replace("/");
    }
  }, [searchParams, router]);

  // Auto-clear error safely (your previous version caused double renders)
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(""), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  // Move cursor to password field when Enter is pressed
  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      passwordRef.current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await login({ email, password });
      router.push("/admin-dashboard");
    } catch (err) {
      if (err instanceof Error && err.message.includes('401')) {
        setError("Invalid email or password");
      } else {
        setError(err instanceof Error ? err.message : "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DotBackgroundDemo>
      <main className="w-full min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          <div className="
            rounded-2xl shadow-2xl p-8 md:p-10 transition-all duration-300
            bg-white/90 dark:bg-gray-900/90
            backdrop-blur-xl
            border border-gray-200 dark:border-gray-800
            hover:shadow-purple-500/20 dark:hover:shadow-purple-500/10
          ">
            <div className="text-center mb-8">
              <div className="
                inline-flex items-center justify-center w-16 h-16 rounded-full mb-4
                bg-purple-100 dark:bg-purple-600/20
              ">
                <Lock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Admin Access
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                Secure login for authorized personnel
              </p>

              {error && (
                <p className="mt-3 text-red-500 text-sm font-medium">
                  {error}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  <Mail className="w-4 h-4" /> Email Address
                </label>

                <div className="relative">
                  <input
                    ref={emailRef}
                    id="email"
                    type="email"
                    value={email}
                    onKeyDown={handleEmailKeyDown}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    placeholder="admin@example.com"
                    required
                    className="
                      w-full px-4 py-3 pl-11 rounded-xl text-base
                      bg-gray-50 dark:bg-gray-800/50
                      border border-gray-300 dark:border-gray-700
                      text-gray-900 dark:text-white
                      placeholder-gray-500 dark:placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                      transition-all duration-200
                    "
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300"
                >
                  <Lock className="w-4 h-4" /> Password
                </label>

                <div className="relative">
                  <input
                    ref={passwordRef}
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    placeholder="••••••••••••"
                    required
                    className="
                      w-full px-4 py-3 pl-11 rounded-xl text-base
                      bg-gray-50 dark:bg-gray-800/50
                      border border-gray-300 dark:border-gray-700
                      text-gray-900 dark:text-white
                      placeholder-gray-500 dark:placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                      transition-all duration-200
                    "
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="
                  w-full py-3 px-4 rounded-xl font-semibold text-white
                  bg-gradient-to-r from-purple-600 to-pink-600
                  hover:from-purple-700 hover:to-pink-700
                  shadow-lg hover:shadow-purple-500/30
                  transform hover:scale-[1.02]
                  transition-all duration-200
                  flex items-center justify-center gap-2
                "
              >
                {isLoading ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-6">
                Protected admin route • Access restricted
              </p>
            </form>

          </div>
        </div>
      </main>
    </DotBackgroundDemo>
  );
}
