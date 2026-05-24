import { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, PieChart, Pie, Cell,
} from "recharts";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { CATEGORIES } from "../lib/categories";
import { formatEGP, formatMonthYear } from "../lib/format";
import { useFadeIn } from "../hooks/useFadeIn";
import Layout from "../components/Layout";
import { InsightsSkeleton } from "../components/Skeleton";
import type { Expense, Budget } from "../types";

const ARABIC_DAYS = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];
const ENGLISH_DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
// const ARABIC_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
// const ENGLISH_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function currentMonthRange() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth()+1;
  return {
    first: `${y}-${String(m).padStart(2,"0")}-01`,
    last:  `${y}-${String(m).padStart(2,"0")}-${String(new Date(y,m,0).getDate()).padStart(2,"0")}`,
    year: y, month: m,
  };
}
function lastMonthRange() {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth()-1);
  const y = d.getFullYear(), m = d.getMonth()+1;
  return {
    first: `${y}-${String(m).padStart(2,"0")}-01`,
    last:  `${y}-${String(m).padStart(2,"0")}-${String(new Date(y,m,0).getDate()).padStart(2,"0")}`,
  };
}
function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
}
function daysInCurrentMonth() { const now = new Date(); return new Date(now.getFullYear(), now.getMonth()+1, 0).getDate(); }
function todayDayOfMonth()    { return new Date().getDate(); }

const COLOR_HEX: Record<string, string> = {
  green:"#22c55e", blue:"#3b82f6", purple:"#a855f7", gray:"#9ca3af",
  pink:"#ec4899", yellow:"#eab308", orange:"#f97316", red:"#ef4444",
  brown:"#92400e", slate:"#64748b",
};
const DOT_CLASS: Record<string, string> = {
  green:"bg-green-500", blue:"bg-blue-500", purple:"bg-purple-500", gray:"bg-gray-400",
  pink:"bg-pink-500", yellow:"bg-yellow-400", orange:"bg-orange-500", red:"bg-red-500",
  brown:"bg-amber-800", slate:"bg-slate-500",
};

function InsightCard({ text, borderColor }: { text: string; borderColor: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm px-4 py-3 border-r-4" style={{ borderColor }}>
      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{text}</p>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-200 mb-1">Day {label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {formatEGP(p.value)}</p>)}
    </div>
  );
}

export default function Insights() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { className: fadeClass } = useFadeIn();

  const DAYS   = language === 'ar' ? ARABIC_DAYS   : ENGLISH_DAYS;
  // const MONTHS = language === 'ar' ? ARABIC_MONTHS : ENGLISH_MONTHS;

  const [loading,     setLoading]     = useState(true);
  const [thisMonth,   setThisMonth]   = useState<Expense[]>([]);
  const [lastMonth,   setLastMonth]   = useState<Expense[]>([]);
  const [budget,      setBudget]      = useState<Budget | null>(null);
  const [savingsGoal, setSavingsGoal] = useState<{ id: string; target_amount: number } | null>(null);
  const [goalInput,   setGoalInput]   = useState("");
  const [savingGoal,  setSavingGoal]  = useState(false);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const cur = currentMonthRange(), prev = lastMonthRange();
    const [thisRes, lastRes, budgetRes, goalRes] = await Promise.all([
      supabase.from("expenses").select("*").eq("user_id", user.id).gte("date", cur.first).lte("date", cur.last),
      supabase.from("expenses").select("*").eq("user_id", user.id).gte("date", prev.first).lte("date", prev.last),
      supabase.from("budgets").select("*").eq("user_id", user.id).single(),
      supabase.from("savings_goals").select("*").eq("user_id", user.id).eq("month", currentMonthKey()).single(),
    ]);
    setThisMonth((thisRes.data as Expense[]) ?? []);
    setLastMonth((lastRes.data as Expense[]) ?? []);
    if (budgetRes.data) setBudget(budgetRes.data as Budget);
    if (goalRes.data)   setSavingsGoal(goalRes.data as { id: string; target_amount: number });
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const totalThisMonth = thisMonth.reduce((s, e) => s + Number(e.amount), 0);
  const totalLast      = lastMonth.reduce((s, e) => s + Number(e.amount), 0);

  const barData = (() => {
    const byDayCur: Record<number, number> = {}, byDayPrev: Record<number, number> = {};
    thisMonth.forEach(e => { const d = new Date(e.date+"T00:00:00").getDate(); byDayCur[d]  = (byDayCur[d]??0)+Number(e.amount); });
    lastMonth.forEach(e => { const d = new Date(e.date+"T00:00:00").getDate(); byDayPrev[d] = (byDayPrev[d]??0)+Number(e.amount); });
    const active = new Set([...Object.keys(byDayCur).map(Number), ...Object.keys(byDayPrev).map(Number)]);
    return Array.from({ length: daysInCurrentMonth() }, (_, i) => i+1)
      .filter(d => active.has(d))
      .map(d => ({ day: d, [t('thisMonth')]: byDayCur[d]??0, [t('lastMonth')]: byDayPrev[d]??0 }));
  })();

  const catBreakdown = CATEGORIES.map(cat => ({
    cat,
    total: thisMonth.filter(e => e.category===cat.id).reduce((s,e)=>s+Number(e.amount),0),
  })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);

  const pieData = catBreakdown.map(c => ({
    name: language === 'ar' ? c.cat.name_ar : c.cat.name_en,
    value: c.total,
    color: COLOR_HEX[c.cat.color] ?? "#9ca3af",
  }));

  // Smart insights
  const insights: { text: string; color: string }[] = [];
  if (thisMonth.length > 0) {
    const dt: Record<number,number>={}, dc: Record<number,number>={};
    thisMonth.forEach(e => { const dow=new Date(e.date+"T00:00:00").getDay(); dt[dow]=(dt[dow]??0)+Number(e.amount); dc[dow]=(dc[dow]??0)+1; });
    let bestDow=0, bestAvg=0;
    Object.keys(dt).forEach(k => { const avg=dt[+k]/dc[+k]; if(avg>bestAvg){bestAvg=avg;bestDow=+k;} });
    insights.push({ text: `🗓️ ${DAYS[bestDow]} — ${Math.round(bestAvg).toLocaleString()} EGP`, color:"#6366f1" });
  }
  if (totalLast > 0 && totalThisMonth > 0) {
    const pct = Math.round(Math.abs((totalThisMonth-totalLast)/totalLast)*100);
    if (totalThisMonth > totalLast) {
      insights.push({ text:`📈 +${pct}% ${language === 'ar' ? 'أكثر من الشهر الماضي' : 'more than last month'}`, color:"#ef4444" });
    } else {
      insights.push({ text:`📉 -${pct}% ${language === 'ar' ? 'أقل من الشهر الماضي 🎉' : 'less than last month 🎉'}`, color:"#22c55e" });
    }
  }
  if (budget && todayDayOfMonth() > 0) {
    const daily=totalThisMonth/todayDayOfMonth(), projected=Math.round(daily*daysInCurrentMonth()), limit=Number(budget.monthly_limit);
    if (projected > limit) {
      insights.push({ text:`⚠️ ${language === 'ar' ? `ستتجاوز ميزانيتك بـ ${(projected-limit).toLocaleString()} جنيه` : `Projected to exceed budget by ${(projected-limit).toLocaleString()} EGP`}`, color:"#f59e0b" });
    } else {
      insights.push({ text:`✅ ${language === 'ar' ? `المتوقع إنفاق ${projected.toLocaleString()} جنيه` : `Projected to spend ${projected.toLocaleString()} EGP`}`, color:"#14b8a6" });
    }
  }
  if (catBreakdown.length > 0 && budget) {
    const top=catBreakdown[0], pct=Math.round((top.total/Number(budget.monthly_limit))*100);
    const catName = language === 'ar' ? top.cat.name_ar : top.cat.name_en;
    insights.push({ text:`🏆 ${catName}: ${top.total.toLocaleString()} EGP (${pct}%)`, color:"#f97316" });
  }
  if (budget) {
    const saved=Math.max(0, Number(budget.monthly_limit)-Math.round((totalThisMonth/todayDayOfMonth())*daysInCurrentMonth()));
    insights.push({ text:`💰 ${language === 'ar' ? `المتوقع توفيره: ${saved.toLocaleString()} جنيه` : `Projected savings: ${saved.toLocaleString()} EGP`}`, color:"#8b5cf6" });
  }

  const handleSaveGoal = async () => {
    if (!user || !goalInput || parseFloat(goalInput) <= 0) return;
    setSavingGoal(true);
    const { data } = await supabase.from("savings_goals")
      .insert({ user_id: user.id, month: currentMonthKey(), target_amount: parseFloat(goalInput) })
      .select().single();
    if (data) setSavingsGoal(data as { id: string; target_amount: number });
    setSavingGoal(false); setGoalInput("");
  };

  const limit        = Number(budget?.monthly_limit ?? 0);
  const saved        = Math.max(0, limit - totalThisMonth);
  const goalTarget   = savingsGoal ? Number(savingsGoal.target_amount) : 0;
  const goalProgress = goalTarget > 0 ? Math.min((saved / goalTarget) * 100, 100) : 0;
  const now          = new Date();
  const monthLabel   = formatMonthYear(now.getFullYear(), now.getMonth() + 1);

  return (
    <Layout title={t('insights')}>
      {loading ? <InsightsSkeleton /> : (
        <div
          className={`px-4 pt-4 pb-8 space-y-4 ${fadeClass}`}
          style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
        >
          {/* Bar chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">{t('monthComparison')}</h2>
            {barData.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <span className="text-5xl">📊</span>
                <p className="text-gray-400 text-sm text-center">{t('noInsightsYet')}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barCategoryGap="30%">
                  <XAxis dataKey="day" tick={{ fontSize:10, fill:"#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:10, fill:"#9ca3af" }} axisLine={false} tickLine={false} width={36} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                  <Bar dataKey={t('thisMonth')}  fill="#14b8a6" radius={[4,4,0,0]} />
                  <Bar dataKey={t('lastMonth')}  fill="#d1d5db" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">{t('spendingBreakdown')}</h2>
            {catBreakdown.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <span className="text-5xl">📊</span>
                <p className="text-gray-400 text-sm">{t('noInsightsYet')}</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={value => [`${formatEGP(Number(value))}`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {catBreakdown.map(({ cat, total }) => {
                    const pct = totalThisMonth > 0 ? Math.round((total/totalThisMonth)*100) : 0;
                    const catLabel = language === 'ar' ? cat.name_ar : cat.name_en;
                    return (
                      <div key={cat.id} className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${DOT_CLASS[cat.color]??"bg-gray-400"}`} />
                        <span className="text-lg">{cat.icon}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-200 flex-1 font-medium">{catLabel}</span>
                        <span className="text-xs text-gray-400">{pct}%</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white w-24 text-left">{formatEGP(total)}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Smart insights */}
          {insights.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-bold text-gray-900 dark:text-white px-1">{t('smartInsights')}</h2>
              {insights.map((ins, i) => <InsightCard key={i} text={ins.text} borderColor={ins.color} />)}
            </div>
          )}

          {/* Savings goal */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">{t('savingsGoal')}</h2>
            {savingsGoal ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('goalTarget')}: {formatEGP(goalTarget)}</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">{t('goalSaved')}: {formatEGP(saved)}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div className="h-3 rounded-full transition-all duration-700"
                    style={{ width:`${goalProgress}%`, backgroundColor: goalProgress>=100?"#22c55e":"#14b8a6" }} />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{Math.round(goalProgress)}{t('goalProgress')}</span>
                  {goalProgress >= 100 && <span className="text-green-500 font-semibold">{t('goalAchieved')}</span>}
                </div>
                <p className="text-xs text-gray-400 text-center">{monthLabel}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('howMuchSave')}</p>
                <div className="flex gap-2">
                  <input type="number" inputMode="decimal" value={goalInput}
                    onChange={e => setGoalInput(e.target.value)} placeholder="0"
                    className="flex-1 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white
                               rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-500 transition
                               [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="flex items-center text-sm text-gray-400 font-medium">EGP</span>
                </div>
                <button onClick={handleSaveGoal} disabled={savingGoal || !goalInput || parseFloat(goalInput) <= 0}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2">
                  {savingGoal ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t('saveGoal')}
                </button>
              </div>
            )}
          </div>

        </div>
      )}
    </Layout>
  );
}