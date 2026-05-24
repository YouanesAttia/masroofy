import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Signup() {
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);

  const validate = (): string | null => {
    if (!name.trim())             return "الاسم مطلوب.";
    if (!email.trim())            return "البريد الإلكتروني مطلوب.";
    if (password.length < 6)      return "كلمة المرور لازم تكون 6 حروف على الأقل.";
    if (password !== confirm)     return "كلمتا المرور مش متطابقتين.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim() },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  // ── Success state ────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 rounded-2xl mb-4 shadow-md">
            <span className="text-white text-2xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">تم إنشاء الحساب!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Check your email to confirm your account before signing in.
          </p>
          <Link
            to="/login"
            className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-semibold
                       px-6 py-2.5 rounded-xl text-sm transition"
          >
            Go to Sign in
          </Link>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 rounded-2xl mb-4 shadow-md">
            <span className="text-white text-2xl font-bold">م</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1" dir="rtl">
            إنشاء حساب جديد
          </h1>
          <p className="text-gray-500 text-sm">
            Join Masroofy and take control of your spending.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ahmed Mohamed"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm
                           placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent
                           transition"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 text-sm
                           placeholder:text-gray-400
                           focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent
                           transition"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-gray-900 text-sm
                             placeholder:text-gray-400
                             focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent
                             transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  tabIndex={-1}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirm"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-xl text-gray-900 text-sm
                             placeholder:text-gray-400
                             focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent
                             transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password match indicator */}
            {confirm.length > 0 && (
              <p className={`text-xs ${password === confirm ? "text-teal-600" : "text-red-500"}`}>
                {password === confirm ? "✓ Passwords match" : "✗ Passwords don't match"}
              </p>
            )}

            {/* Error */}
            {error && (
              <p className="text-red-500 text-sm text-center" dir="rtl">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400
                         text-white font-semibold py-2.5 rounded-xl text-sm
                         transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-teal-600 font-semibold hover:text-teal-700 transition"
          >
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}