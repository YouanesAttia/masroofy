import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { CATEGORIES } from "../lib/categories";
import { checkAndNotify } from "../lib/notifications";

function todayString() {
  return new Date().toISOString().split("T")[0];
}

const PLACEHOLDERS_AR: Record<string, string> = {
  food: "فول، كشري، Uber Eats...", transport: "أوبر، توك توك، مترو...",
  recharge: "فودافون، أورنج، اتصالات...", printing: "ملازم، أبحاث، تصوير...",
  entertainment: "سينما، بلايستيشن، نتفليكس...", stationery: "أقلام، دفاتر، محفظة...",
  clothes: "تيشيرت، جزمة، شنطة...", health: "صيدلية، دكتور، كشف...",
  rent: "إيجار شقة، مصاريف بيت...", other: "أي مصروف تاني...",
};
const PLACEHOLDERS_EN: Record<string, string> = {
  food: "Lunch, groceries, Uber Eats...", transport: "Uber, bus, metro...",
  recharge: "Vodafone, Orange, Etisalat...", printing: "Notes, handouts, copies...",
  entertainment: "Cinema, PlayStation, Netflix...", stationery: "Pens, notebooks...",
  clothes: "T-shirt, shoes, bag...", health: "Pharmacy, doctor...",
  rent: "Apartment rent, bills...", other: "Any other expense...",
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddExpenseSheet({ isOpen, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const placeholders = language === 'ar' ? PLACEHOLDERS_AR : PLACEHOLDERS_EN;

  const [amount,    setAmount]    = useState("");
  const [category,  setCategory]  = useState("food");
  const [title,     setTitle]     = useState("");
  const [date,      setDate]      = useState(todayString());
  const [note,      setNote]      = useState("");
  const [recurring, setRecurring] = useState(false);

  const [loading,      setLoading]      = useState(false);
  const [amountError,  setAmountError]  = useState<string | null>(null);
  const [titleError,   setTitleError]   = useState<string | null>(null);
  const [serverError,  setServerError]  = useState<string | null>(null);

  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => amountRef.current?.focus(), 300);
  }, [isOpen]);

  const resetForm = () => {
    setAmount(""); setCategory("food"); setTitle("");
    setDate(todayString()); setNote(""); setRecurring(false);
    setAmountError(null); setTitleError(null); setServerError(null);
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleSave = async () => {
    setAmountError(null); setTitleError(null); setServerError(null);
    let valid = true;
    if (!amount || parseFloat(amount) <= 0) { setAmountError(t('enterAmount')); valid = false; }
    if (!title.trim())                       { setTitleError(t('enterTitle'));   valid = false; }
    if (!valid) return;

    setLoading(true);

    const { error } = await supabase.from("expenses").insert({
      user_id:      user!.id,
      title:        title.trim(),
      amount:       parseFloat(amount),
      category,
      date,
      note:         note.trim() || null,
      is_recurring: recurring,
    });

    if (error) {
      setServerError(t('saveError'));
      setLoading(false);
      return;
    }

    // ── Fetch updated totals and trigger roast notification ──
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString().split('T')[0];

    const [expensesRes, budgetRes] = await Promise.all([
      supabase.from('expenses')
        .select('amount')
        .eq('user_id', user!.id)
        .gte('date', firstDay),
      supabase.from('budgets')
        .select('monthly_limit, warning_threshold')
        .eq('user_id', user!.id)
        .single(),
    ]);

    if (expensesRes.data && budgetRes.data) {
      const totalSpent = expensesRes.data.reduce(
        (sum, e) => sum + Number(e.amount), 0
      );
      checkAndNotify({
        spent:             totalSpent,
        limit:             Number(budgetRes.data.monthly_limit),
        threshold:         Number(budgetRes.data.warning_threshold),
        lastExpenseAmount: parseFloat(amount),
        language,
      });
    }

    setLoading(false);
    onSuccess();
    resetForm();
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300
          ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />

      {/* Sheet */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-50
          bg-white dark:bg-gray-800
          rounded-t-3xl shadow-2xl
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-y-0" : "translate-y-full"}
          max-h-[92vh] overflow-y-auto
        `}
        style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('addExpense')}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pb-8 space-y-5">
          {serverError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <p className="text-red-500 text-sm text-center">{serverError}</p>
            </div>
          )}

          {/* Amount */}
          <div>
            <div className={`flex items-center gap-3 border-2 rounded-2xl px-4 py-3 transition
              ${amountError ? "border-red-400" : "border-gray-200 dark:border-gray-600 focus-within:border-teal-500"}`}>
              <span className="text-gray-400 text-lg font-medium select-none">EGP</span>
              <input
                ref={amountRef}
                type="number" inputMode="decimal" min="0" step="any"
                placeholder="0" value={amount}
                onChange={e => { setAmount(e.target.value); if (amountError) setAmountError(null); }}
                className="flex-1 text-4xl font-bold text-gray-900 dark:text-white text-right
                           bg-transparent outline-none
                           [appearance:textfield]
                           [&::-webkit-outer-spin-button]:appearance-none
                           [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            {amountError && <p className="text-red-500 text-xs mt-1">{amountError}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('category')}
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {CATEGORIES.map(cat => {
                const isSelected = category === cat.id;
                const catLabel   = language === 'ar' ? cat.name_ar : cat.name_en;
                return (
                  <button
                    key={cat.id} type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full
                      text-sm font-medium whitespace-nowrap shrink-0
                      transition-all duration-150
                      ${isSelected
                        ? "bg-teal-600 text-white shadow-sm scale-105"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
                  >
                    <span>{cat.icon}</span>
                    <span>{catLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t('item')}
            </label>
            <input
              type="text" value={title}
              placeholder={placeholders[category]}
              onChange={e => { setTitle(e.target.value); if (titleError) setTitleError(null); }}
              className={`w-full px-4 py-2.5 border-2 rounded-xl text-sm
                text-gray-900 dark:text-white dark:bg-gray-700
                placeholder:text-gray-300 dark:placeholder:text-gray-500
                outline-none transition
                ${titleError ? "border-red-400" : "border-gray-200 dark:border-gray-600 focus:border-teal-500"}`}
            />
            {titleError && <p className="text-red-500 text-xs mt-1">{titleError}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t('date')}
            </label>
            <input
              type="date" value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600
                         dark:bg-gray-700 dark:text-white rounded-xl text-sm
                         outline-none focus:border-teal-500 transition"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              {t('note')} <span className="font-normal text-gray-400">({t('optional')})</span>
            </label>
            <textarea
              value={note} rows={2}
              onChange={e => setNote(e.target.value)}
              placeholder="..."
              className="w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600
                         dark:bg-gray-700 dark:text-white rounded-xl text-sm resize-none
                         placeholder:text-gray-300 dark:placeholder:text-gray-500
                         outline-none focus:border-teal-500 transition"
            />
          </div>

          {/* Recurring */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('repeatMonthly')}
              </label>
              <button
                type="button" onClick={() => setRecurring(v => !v)}
                className={`relative inline-flex items-center w-11 h-6 rounded-full
                  transition-colors duration-200
                  ${recurring ? "bg-teal-600" : "bg-gray-200 dark:bg-gray-600"}`}
              >
                <span className={`inline-block w-4 h-4 bg-white rounded-full shadow
                  transform transition-transform duration-200
                  ${recurring ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
            {recurring && (
              <p className="text-teal-600 text-xs mt-1.5">{t('willAutoAdd')}</p>
            )}
          </div>

          {/* Save */}
          <button
            type="button" onClick={handleSave} disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400
                       text-white font-bold py-3.5 rounded-2xl text-base
                       transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('saving')}</>
              : t('save')}
          </button>
        </div>
      </div>
    </>
  );
}