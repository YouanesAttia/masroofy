import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { CATEGORIES } from "../lib/categories";
import { getRoast } from "../lib/roastMessages";
import { formatEGP, formatTimeAgo } from "../lib/format";
import { useFadeIn } from "../hooks/useFadeIn";
import Layout from "../components/Layout";
import AddExpenseSheet from "../components/AddExpenseSheet";
import Toast from "../components/Toast";
import { DashboardSkeleton } from "../components/Skeleton";
import type { Expense, Budget } from "../types";

// ── Helpers ───────────────────────────────────────────────────
function daysRemainingInMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
}
function firstDayOfMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`;
}
function todayString() { return new Date().toISOString().split("T")[0]; }
function getCat(id: string) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

const COLOR_MAP: Record<string, string> = {
  green:  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  blue:   "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  gray:   "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  pink:   "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  red:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  brown:  "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  slate:  "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
};

// ── Animated SVG ring ─────────────────────────────────────────
function CircleRing({ percent, remaining }: { percent: number; remaining: number }) {
  const [animated, setAnimated] = useState(0);
  const size = 180, strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(Math.min(percent, 100)), 100);
    return () => clearTimeout(timer);
  }, [percent]);

  const dashOffset  = circumference - (animated / 100) * circumference;
  const ringColor   = percent >= 100 ? "#ef4444" : percent >= 80 ? "#f59e0b" : percent >= 60 ? "#f59e0b" : "#14b8a6";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} className="dark:stroke-gray-700" />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={ringColor} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease-out, stroke 0.4s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {remaining.toLocaleString()}
        </span>
        <span className="text-xs text-gray-400 mt-0.5">EGP</span>
      </div>
    </div>
  );
}

// ── Roast banner ──────────────────────────────────────────────
function RoastBanner({
  scenario,
  language,
  roastText,
}: {
  scenario: 'warning' | 'exceeded';
  language: 'ar' | 'en';
  roastText: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  const { t } = useLanguage();

  if (dismissed) return null;

  const isExceeded  = scenario === 'exceeded';
  const borderColor = isExceeded ? "border-red-400"   : "border-amber-400";
  const bgColor     = isExceeded ? "bg-red-50 dark:bg-red-900/20"   : "bg-amber-50 dark:bg-amber-900/20";
  const textColor   = isExceeded ? "text-red-700 dark:text-red-300" : "text-amber-800 dark:text-amber-300";
  const title       = isExceeded ? t('roastExceededTitle') : t('roastWarningTitle');

  return (
    <div
      className={`
        ${bgColor} border-2 ${borderColor}
        rounded-2xl px-4 py-3
        border-s-4
      `}
      style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold mb-1 ${textColor}`}>{title}</p>
          <p className={`text-sm leading-relaxed ${textColor}`}>{roastText}</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-lg
            ${isExceeded
              ? "text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
              : "text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"}
            transition`}
        >
          {t('roastDismiss')}
        </button>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const { user }            = useAuth();
  const { t, language }     = useLanguage();
  const navigate            = useNavigate();
  const { className: fadeClass } = useFadeIn();

  const [budget,   setBudget]   = useState<Budget | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [sheetOpen,     setSheetOpen]     = useState(false);
  const [toastVisible,  setToastVisible]  = useState(false);

  // Pre-computed roast messages — regenerated on every fetchData call
  const [warningRoast,  setWarningRoast]  = useState(() => getRoast('warning',  language));
  const [exceededRoast, setExceededRoast] = useState(() => getRoast('exceeded', language));

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [budgetRes, expensesRes] = await Promise.all([
      supabase.from("budgets").select("*").eq("user_id", user.id).single(),
      supabase.from("expenses").select("*").eq("user_id", user.id)
        .gte("date", firstDayOfMonth()).lte("date", todayString())
        .order("date", { ascending: false })
        .order("created_at", { ascending: false }),
    ]);

    if (budgetRes.data)   setBudget(budgetRes.data as Budget);
    if (expensesRes.data) setExpenses(expensesRes.data as Expense[]);

    // Refresh roast messages on each fetch so user sees a new one after adding expense
    setWarningRoast(getRoast('warning',  language));
    setExceededRoast(getRoast('exceeded', language));

    setLoading(false);
  }, [user, language]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // ── Derived numbers ────────────────────────────────────────
  const totalSpent   = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const monthlyLimit = budget?.monthly_limit ?? 0;
  const remaining    = monthlyLimit - totalSpent;
  const percentSpent = monthlyLimit > 0 ? (totalSpent / monthlyLimit) * 100 : 0;
  const daysLeft     = daysRemainingInMonth();
  const threshold    = budget?.warning_threshold ?? 80;

  const categoryTotals = CATEGORIES.map(cat => ({
    cat,
    total: expenses.filter(e => e.category === cat.id).reduce((s, e) => s + Number(e.amount), 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total).slice(0, 4);

  const pillsToShow    = categoryTotals.length > 0
    ? categoryTotals
    : CATEGORIES.slice(0, 4).map(cat => ({ cat, total: 0 }));
  const recentExpenses = expenses.slice(0, 5);

  const handleSuccess = () => {
    fetchData();
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  };

  // ── Roast banner logic ─────────────────────────────────────
  const showExceeded = !!budget && percentSpent >= 100;
  const showWarning  = !!budget && percentSpent >= threshold && percentSpent < 100;

  return (
    <Layout title={t('home')}>
      <Toast message={t('expenseAdded')} type="success" visible={toastVisible} />

      {loading ? <DashboardSkeleton /> : (
        <div
          className={`px-4 pt-4 pb-6 space-y-4 ${fadeClass}`}
          style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
        >
          {/* Budget card */}
          {!budget ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 flex flex-col items-center gap-3">
              <span className="text-4xl">💰</span>
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                {t('noBudgetYet')}
              </p>
              <button
                onClick={() => navigate("/settings")}
                className="bg-teal-600 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-teal-700 transition"
              >
                {t('setBudget')}
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
              <div className="flex justify-center mb-4">
                <CircleRing percent={percentSpent} remaining={remaining} />
              </div>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {t('spent')}{" "}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {formatEGP(totalSpent)}
                </span>{" "}
                {t('of')}{" "}
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {formatEGP(Number(monthlyLimit))}
                </span>{" "}
                —{" "}
                <span className="font-semibold text-teal-600">
                  {daysLeft} {t('daysLeft')}
                </span>
              </p>
            </div>
          )}

          {/* ── Roast banners (replace plain warning) ──────── */}
          {showExceeded && (
            <RoastBanner
              key={exceededRoast}
              scenario="exceeded"
              language={language}
              roastText={exceededRoast}
            />
          )}
          {showWarning && (
            <RoastBanner
              key={warningRoast}
              scenario="warning"
              language={language}
              roastText={warningRoast}
            />
          )}

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {pillsToShow.map(({ cat, total }) => {
              const colorClass = COLOR_MAP[cat.color] ?? "bg-gray-100 text-gray-600";
              const catLabel   = language === 'ar' ? cat.name_ar : cat.name_en;
              return (
                <div key={cat.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full
                  text-xs font-medium whitespace-nowrap shrink-0 ${colorClass}`}>
                  <span>{cat.icon}</span>
                  <span>{catLabel}:</span>
                  <span>{formatEGP(total)}</span>
                </div>
              );
            })}
          </div>

          {/* Recent expenses */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <Link to="/history" className="text-teal-600 dark:text-teal-400 text-sm font-medium hover:underline">
                {t('viewAll')}
              </Link>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                {t('recentExpenses')}
              </h2>
            </div>

            {recentExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 px-6">
                <span className="text-6xl">💸</span>
                <p className="text-gray-700 dark:text-gray-200 font-bold text-base text-center">
                  {t('noExpenses')}
                </p>
                <button
                  onClick={() => setSheetOpen(true)}
                  className="mt-1 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold
                             px-5 py-2.5 rounded-xl transition active:scale-95"
                >
                  + {t('addFirst')}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {recentExpenses.map(expense => {
                  const cat        = getCat(expense.category);
                  const colorClass = COLOR_MAP[cat.color] ?? "bg-gray-100 text-gray-600";
                  const catLabel   = language === 'ar' ? cat.name_ar : cat.name_en;
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${colorClass}`}>
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {expense.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{catLabel}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          -{formatEGP(Number(expense.amount))}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatTimeAgo(expense.date)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setSheetOpen(true)}
        aria-label={t('addExpense')}
        className="fixed bottom-20 left-1/2 -translate-x-1/2
                   md:bottom-8 md:right-8 md:left-auto md:translate-x-0
                   w-14 h-14 bg-teal-600 hover:bg-teal-700
                   text-white rounded-full shadow-lg
                   flex items-center justify-center
                   transition-all active:scale-95 z-30"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      <AddExpenseSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSuccess={handleSuccess}
      />
    </Layout>
  );
}