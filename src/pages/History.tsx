import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight, X, Search } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { CATEGORIES } from "../lib/categories";
import { formatEGP, formatDateHeader, formatMonthYear } from "../lib/format";
import { useFadeIn } from "../hooks/useFadeIn";
import Layout from "../components/Layout";
import { HistorySkeleton } from "../components/Skeleton";
import type { Expense } from "../types";

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

function getCat(id: string) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
function firstDayOf(y: number, m: number) {
  return `${y}-${String(m).padStart(2,"0")}-01`;
}
function lastDayOf(y: number, m: number) {
  return `${y}-${String(m).padStart(2,"0")}-${String(new Date(y,m,0).getDate()).padStart(2,"0")}`;
}
function formatTime(createdAt: string) {
  return new Date(createdAt).toLocaleTimeString("ar-EG", { hour:"2-digit", minute:"2-digit", hour12: false });
}

// ── Swipeable expense row ─────────────────────────────────────
function ExpenseRow({ expense, onEdit, onDelete }: {
  expense: Expense;
  onEdit: (e: Expense) => void;
  onDelete: (id: string) => void;
}) {
  const { language } = useLanguage();
  const cat = getCat(expense.category);
  const colorClass = COLOR_MAP[cat.color] ?? "bg-gray-100 text-gray-600";
  const catLabel = language === 'ar' ? cat.name_ar : cat.name_en;

  const startXRef   = useRef(0);
  const currentXRef = useRef(0);
  const [translateX, setTranslateX] = useState(0);
  const [swiped,     setSwiped]     = useState(false);
  const THRESHOLD = -72;

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-18 flex items-center justify-center bg-red-500 px-5">
        <button onClick={() => onDelete(expense.id)} className="text-white text-xs font-bold">
          حذف
        </button>
      </div>
      <div
        style={{ transform: `translateX(${translateX}px)`, transition: translateX === 0 ? "transform 0.2s" : "none" }}
        onTouchStart={e => { startXRef.current = e.touches[0].clientX; }}
        onTouchMove={e => {
          const diff = e.touches[0].clientX - startXRef.current;
          currentXRef.current = diff;
          if (diff < 0) setTranslateX(Math.max(diff, THRESHOLD));
        }}
        onTouchEnd={() => {
          if (currentXRef.current < THRESHOLD / 2) { setTranslateX(THRESHOLD); setSwiped(true); }
          else { setTranslateX(0); setSwiped(false); }
          currentXRef.current = 0;
        }}
        onClick={() => {
          if (swiped) { setTranslateX(0); setSwiped(false); return; }
          onEdit(expense);
        }}
        className="relative flex items-center gap-3 px-4 py-3
                   bg-white dark:bg-gray-800
                   hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${colorClass}`}>
          {cat.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{expense.title}</p>
          {expense.note
            ? <p className="text-xs text-gray-400 truncate mt-0.5">{expense.note}</p>
            : <p className="text-xs text-gray-400 mt-0.5">{catLabel}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white">-{formatEGP(Number(expense.amount))}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatTime(expense.created_at)}</p>
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────
function EditModal({ expense, onClose, onSaved, onDeleted }: {
  expense: Expense; onClose: () => void; onSaved: () => void; onDeleted: () => void;
}) {
  const { t, language } = useLanguage();
  const [amount,    setAmount]    = useState(String(expense.amount));
  const [category,  setCategory]  = useState(expense.category);
  const [title,     setTitle]     = useState(expense.title);
  const [date,      setDate]      = useState(expense.date);
  const [note,      setNote]      = useState(expense.note ?? "");
  const [recurring, setRecurring] = useState(expense.is_recurring);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [confirm,   setConfirm]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) { setError(t('enterAmount')); return; }
    if (!title.trim())                       { setError(t('enterTitle'));  return; }
    setError(null); setSaving(true);
    const { error: err } = await supabase.from("expenses")
      .update({ amount: parseFloat(amount), category, title: title.trim(), date, note: note.trim() || null, is_recurring: recurring })
      .eq("id", expense.id);
    setSaving(false);
    if (err) { setError(t('saveError')); return; }
    onSaved();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await supabase.from("expenses").delete().eq("id", expense.id);
    setDeleting(false);
    onDeleted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto"
        style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-700">
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <X size={18} />
          </button>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{t('editExpense')}</h2>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('amount')} (EGP)</label>
            <input type="number" inputMode="decimal" value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2.5 text-2xl font-bold text-right outline-none focus:border-teal-500 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{t('category')}</label>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {CATEGORIES.map(cat => (
                <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition
                    ${category === cat.id ? "bg-teal-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
                  <span>{cat.icon}</span>
                  <span>{language === 'ar' ? cat.name_ar : cat.name_en}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('item')}</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              className="w-full border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('date')}</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
              {t('note')} <span className="font-normal text-gray-400">({t('optional')})</span>
            </label>
            <textarea value={note} rows={2} onChange={e => setNote(e.target.value)}
              className="w-full border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:border-teal-500 transition"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('repeatMonthly')}</label>
            <button type="button" onClick={() => setRecurring(v => !v)}
              className={`relative inline-flex items-center w-11 h-6 rounded-full transition-colors duration-200 ${recurring ? "bg-teal-600" : "bg-gray-200 dark:bg-gray-600"}`}>
              <span className={`inline-block w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${recurring ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <button onClick={handleSave} disabled={saving}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2">
            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('saving')}</> : t('saveChanges')}
          </button>

          {!confirm ? (
            <button onClick={() => setConfirm(true)}
              className="w-full border-2 border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold py-3 rounded-xl text-sm transition">
              {t('deleteExpense')}
            </button>
          ) : (
            <div className="border-2 border-red-200 dark:border-red-800 rounded-xl p-4 space-y-3">
              <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">{t('deleteConfirm')}</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirm(false)}
                  className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-2 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  {t('cancel')}
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-1">
                  {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t('confirm')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function History() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const now = new Date();
  const { className: fadeClass } = useFadeIn();

  const [selectedMonth, setSelectedMonth] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [expenses,  setExpenses]  = useState<Expense[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [activeCat, setActiveCat] = useState("all");
  const [search,    setSearch]    = useState("");
  const [editing,   setEditing]   = useState<Expense | null>(null);

  const isCurrentMonth = selectedMonth.year === now.getFullYear() && selectedMonth.month === now.getMonth() + 1;

  const fetchExpenses = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("expenses").select("*")
      .eq("user_id", user.id)
      .gte("date", firstDayOf(selectedMonth.year, selectedMonth.month))
      .lte("date", lastDayOf(selectedMonth.year, selectedMonth.month))
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    setExpenses((data as Expense[]) ?? []);
    setActiveCat("all"); setSearch("");
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedMonth]);

  const prevMonth = () => setSelectedMonth(m => m.month === 1 ? { year: m.year-1, month: 12 } : { ...m, month: m.month-1 });
  const nextMonth = () => { if (!isCurrentMonth) setSelectedMonth(m => m.month === 12 ? { year: m.year+1, month: 1 } : { ...m, month: m.month+1 }); };

  const usedCategories = CATEGORIES.filter(c => expenses.some(e => e.category === c.id));
  const filtered = expenses.filter(e => {
    const catMatch    = activeCat === "all" || e.category === activeCat;
    const searchMatch = e.title.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  const grouped: Record<string, Expense[]> = {};
  filtered.forEach(e => { if (!grouped[e.date]) grouped[e.date] = []; grouped[e.date].push(e); });
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);
  const monthLabel = formatMonthYear(selectedMonth.year, selectedMonth.month);

  const handleSwipeDelete = async (id: string) => {
    await supabase.from("expenses").delete().eq("id", id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  return (
    <Layout title={t('history')}>
      <div className={`flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 ${fadeClass}`}
           style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>

        {/* Month selector */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <button onClick={language === 'ar' ? nextMonth : prevMonth}
            disabled={language === 'ar' ? isCurrentMonth : false}
            className={`p-2 rounded-xl transition ${(language === 'ar' ? isCurrentMonth : false) ? "text-gray-200 dark:text-gray-600 cursor-not-allowed" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
            <ChevronRight size={20} />
          </button>
          <span className="text-base font-bold text-gray-900 dark:text-white">{monthLabel}</span>
          <button onClick={language === 'ar' ? prevMonth : nextMonth}
            disabled={language === 'en' ? isCurrentMonth : false}
            className={`p-2 rounded-xl transition ${(language === 'en' ? isCurrentMonth : false) ? "text-gray-200 dark:text-gray-600 cursor-not-allowed" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"}`}>
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Category filter */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-2.5 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <button onClick={() => setActiveCat("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition
              ${activeCat === "all" ? "bg-teal-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"}`}>
            {t('all')}
          </button>
          {usedCategories.map(cat => (
            <button key={cat.id} onClick={() => setActiveCat(cat.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition
                ${activeCat === cat.id ? "bg-teal-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}>
              <span>{cat.icon}</span>
              <span>{language === 'ar' ? cat.name_ar : cat.name_en}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-2.5">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600
                         dark:text-white rounded-xl pr-9 pl-9 py-2 text-sm placeholder:text-gray-400
                         outline-none focus:border-teal-500 transition"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto pb-32">
          {loading ? <HistorySkeleton /> : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="text-5xl">🗓️</span>
              <p className="text-gray-700 dark:text-gray-200 font-bold text-base text-center">
                {t('noExpensesMonth')}
              </p>
            </div>
          ) : (
            <div className="pt-2">
              {sortedDates.map(date => (
                <div key={date} className="mb-2">
                  <div className="px-4 py-1.5">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {formatDateHeader(date)}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl mx-3 overflow-hidden shadow-sm divide-y divide-gray-50 dark:divide-gray-700">
                    {grouped[date].map(expense => (
                      <ExpenseRow key={expense.id} expense={expense} onEdit={setEditing} onDelete={handleSwipeDelete} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom summary */}
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:ml-60 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-5 py-3 z-20">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
            {t('monthTotal')} {monthLabel}:{" "}
            <span className="text-teal-600 dark:text-teal-400 font-bold">{formatEGP(total)}</span>
          </p>
        </div>
      </div>

      {editing && (
        <EditModal
          expense={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); fetchExpenses(); }}
          onDeleted={() => { setEditing(null); fetchExpenses(); }}
        />
      )}
    </Layout>
  );
}