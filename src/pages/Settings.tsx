import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Check, X, LogOut, Download, Trash2, MessageSquare } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { CATEGORIES } from "../lib/categories";
import Layout from "../components/Layout";
import Toast from "../components/Toast";
import { requestPermission } from "../lib/notifications";

// ── applyTheme ────────────────────────────────────────────────
function applyTheme(theme: string) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldBeDark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", shouldBeDark);
  localStorage.setItem("masroofy-theme", theme);
}

// ── Arabic ordinals ───────────────────────────────────────────
const ARABIC_ORDINALS: Record<number, string> = {
  1:"أول الشهر", 2:"الثاني", 3:"الثالث", 4:"الرابع", 5:"الخامس",
  6:"السادس", 7:"السابع", 8:"الثامن", 9:"التاسع", 10:"العاشر",
  11:"الحادي عشر", 12:"الثاني عشر", 13:"الثالث عشر", 14:"الرابع عشر",
  15:"الخامس عشر", 16:"السادس عشر", 17:"السابع عشر", 18:"الثامن عشر",
  19:"التاسع عشر", 20:"العشرون", 21:"الحادي والعشرون", 22:"الثاني والعشرون",
  23:"الثالث والعشرون", 24:"الرابع والعشرون", 25:"الخامس والعشرون",
  26:"السادس والعشرون", 27:"السابع والعشرون", 28:"الثامن والعشرون",
};

function currentMonthRange() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1;
  const first = `${y}-${String(m).padStart(2,"0")}-01`;
  const last  = new Date(y, m, 0).getDate();
  return { first, last: `${y}-${String(m).padStart(2,"0")}-${String(last).padStart(2,"0")}`, month: m, year: y };
}

// ── Card wrapper ──────────────────────────────────────────────
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  );
}

// ── Feedback modal ────────────────────────────────────────────
function FeedbackModal({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 800));
    setSent(true);
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <X size={18} />
          </button>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('sendFeedback')}</h3>
        </div>
        {sent ? (
          <div className="text-center py-6 space-y-2">
            <span className="text-4xl">🙏</span>
            <p className="text-gray-700 dark:text-gray-200 font-semibold">{t('thankYou')}</p>
            <p className="text-gray-400 text-sm">{t('feedbackThanks')}</p>
            <button onClick={onClose} className="mt-2 text-teal-600 text-sm font-semibold">{t('close')}</button>
          </div>
        ) : (
          <>
            <textarea value={text} onChange={e => setText(e.target.value)} rows={4}
              placeholder={t('feedbackPlaceholder')}
              className="w-full border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2.5 text-sm resize-none outline-none focus:border-teal-500 transition"
            />
            <button onClick={handleSend} disabled={sending || !text.trim()}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2">
              {sending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t('send')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Delete modal ──────────────────────────────────────────────
function DeleteModal({ onClose, onConfirmed }: { onClose: () => void; onConfirmed: () => void }) {
  const { t } = useLanguage();
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const confirmed = typed.toLowerCase() === t('deleteConfirmWord').toLowerCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
        <div className="text-center space-y-1">
          <span className="text-4xl">⚠️</span>
          <h3 className="text-base font-bold text-red-600 mt-2">{t('deleteAllData')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('deleteAllWarning')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('cannotUndo')}</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
            {t('typeToConfirm')}{" "}
            <span className="text-red-500 font-bold">"{t('deleteConfirmWord')}"</span>{" "}
            {t('toConfirm')}
          </label>
          <input type="text" value={typed} onChange={e => setTyped(e.target.value)}
            className="w-full border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-400 transition"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            {t('cancel')}
          </button>
          <button
            onClick={async () => { setDeleting(true); await onConfirmed(); setDeleting(false); }}
            disabled={!confirmed || deleting}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-1">
            {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t('deleteEverything')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────
interface Profile {
  id: string; email: string; name: string;
  plan: "free" | "pro"; language: "ar" | "en";
  theme: "light" | "dark" | "system";
}
interface Budget {
  id: string; monthly_limit: number;
  reset_day: number; warning_threshold: number;
}

// ── Main ──────────────────────────────────────────────────────
export default function Settings() {
  const { user, signOut }   = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  const [profile,     setProfile]     = useState<Profile | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameVal,     setNameVal]     = useState("");
  const [savingName,  setSavingName]  = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [budget,        setBudget]        = useState<Budget | null>(null);
  const [monthlyLimit,  setMonthlyLimit]  = useState("");
  const [resetDay,      setResetDay]      = useState(1);
  const [warnThreshold, setWarnThreshold] = useState(80);
  const [savingBudget,  setSavingBudget]  = useState(false);

  const [themeState,    setThemeState]    = useState<"light"|"dark"|"system">("system");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    "Notification" in window ? Notification.permission : "denied"
  );

  const [toastMsg,     setToastMsg]     = useState("");
  const [toastType,    setToastType]    = useState<"success"|"error">("success");
  const [toastVisible, setToastVisible] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showDelete,   setShowDelete]   = useState(false);
  const [exporting,    setExporting]    = useState(false);
  const [signingOut,   setSigningOut]   = useState(false);

  const showToast = (msg: string, type: "success"|"error" = "success") => {
    setToastMsg(msg); setToastType(type); setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  };

  // ── Fetch ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [profRes, budgetRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("budgets").select("*").eq("user_id", user.id).single(),
      ]);
      if (profRes.data) {
        const p = profRes.data as Profile;
        setProfile(p);
        setNameVal(p.name ?? "");
        setThemeState(p.theme as "light"|"dark"|"system");
        applyTheme(p.theme);
      }
      if (budgetRes.data) {
        const b = budgetRes.data as Budget;
        setBudget(b);
        setMonthlyLimit(String(b.monthly_limit));
        setResetDay(b.reset_day);
        setWarnThreshold(b.warning_threshold);
      }
    };
    load();
  }, [user]);

  // ── Theme effect ───────────────────────────────────────────
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // ── Save name ──────────────────────────────────────────────
  const saveName = async () => {
    if (!user || !nameVal.trim()) return;
    setSavingName(true);
    const { error } = await supabase.from("profiles").update({ name: nameVal.trim() }).eq("id", user.id);
    setSavingName(false);
    if (!error) {
      setProfile(p => p ? { ...p, name: nameVal.trim() } : p);
      setEditingName(false);
      showToast(t('nameSaved'));
    }
  };

  // ── Save budget ────────────────────────────────────────────
  const saveBudget = async () => {
    if (!user || !monthlyLimit || parseFloat(monthlyLimit) <= 0) {
      showToast(t('errorSaving'), "error"); return;
    }
    setSavingBudget(true);
    const payload = { monthly_limit: parseFloat(monthlyLimit), reset_day: resetDay, warning_threshold: warnThreshold };
    let error;
    if (budget) {
      ({ error } = await supabase.from("budgets").update(payload).eq("id", budget.id));
    } else {
      ({ error } = await supabase.from("budgets").insert({ ...payload, user_id: user.id }));
    }
    setSavingBudget(false);
    if (!error) showToast(t('budgetSaved'));
    else showToast(t('errorSaving'), "error");
  };

  // ── Save theme ─────────────────────────────────────────────
  const saveTheme = async (th: "light"|"dark"|"system") => {
    setThemeState(th);
    applyTheme(th);
    setProfile(p => p ? { ...p, theme: th } : p);
    if (user) await supabase.from("profiles").update({ theme: th }).eq("id", user.id);
  };

  // ── Notifications ──────────────────────────────────────────
  const handleRequestNotif = async () => {
    const granted = await requestPermission();
    setNotifPermission(granted ? "granted" : "denied");
  };

  // ── Export CSV ─────────────────────────────────────────────
  const exportCSV = async () => {
    if (!user) return;
    setExporting(true);
    const { first, last, month, year } = currentMonthRange();
    const { data } = await supabase.from("expenses").select("*")
      .eq("user_id", user.id).gte("date", first).lte("date", last).order("date", { ascending: true });

    if (data && data.length > 0) {
      const header = "Date,Item,Category,Amount,Note";
      const rows = data.map((e: { date: string; title: string; category: string; amount: number; note?: string }) => {
        const cat = CATEGORIES.find(c => c.id === e.category);
        return [`"${e.date}"`,`"${e.title}"`,`"${language === 'ar' ? (cat?.name_ar ?? e.category) : (cat?.name_en ?? e.category)}"`,e.amount,`"${e.note ?? ""}"`].join(",");
      });
      const csv  = [header, ...rows].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `masroofy-${month}-${year}.csv`; a.click();
      URL.revokeObjectURL(url);
      showToast(t('exportSuccess'));
    } else {
      showToast(t('noExpensesExport'), "error");
    }
    setExporting(false);
  };

  // ── Delete all ─────────────────────────────────────────────
  const deleteAllData = async () => {
    if (!user) return;
    await Promise.all([
      supabase.from("expenses").delete().eq("user_id", user.id),
      supabase.from("savings_goals").delete().eq("user_id", user.id),
      supabase.from("budgets").update({ monthly_limit: 2000, reset_day: 1, warning_threshold: 80 }).eq("user_id", user.id),
    ]);
    await signOut();
    navigate("/login");
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate("/login");
  };

  return (
    <Layout title={t('settings')}>
      <Toast message={toastMsg} type={toastType} visible={toastVisible} />

      <div
        className="px-4 pt-4 pb-10 space-y-4"
        style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
      >

        {/* Profile */}
        <Card title={t('myAccount')}>
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">{t('name')}</p>
              {editingName ? (
                <input ref={nameInputRef} autoFocus type="text" value={nameVal}
                  onChange={e => setNameVal(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveName()}
                  className="w-full border-2 border-teal-500 rounded-lg px-2 py-1 text-sm text-gray-900 dark:bg-gray-700 dark:text-white outline-none"
                />
              ) : (
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {profile?.name || "—"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 ms-3">
              {editingName ? (
                <>
                  <button onClick={saveName} disabled={savingName}
                    className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition">
                    {savingName ? <div className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" /> : <Check size={15} />}
                  </button>
                  <button onClick={() => { setEditingName(false); setNameVal(profile?.name ?? ""); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <X size={15} />
                  </button>
                </>
              ) : (
                <button onClick={() => { setEditingName(true); setTimeout(() => nameInputRef.current?.focus(), 50); }}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                  <Pencil size={15} />
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 mb-0.5">{t('email')}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{profile?.email ?? user?.email}</p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">{t('currentPlan')}</p>
            {profile?.plan === "pro" ? (
              <span className="px-3 py-1 bg-teal-600 text-white text-xs font-bold rounded-full">{t('pro')}</span>
            ) : (
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-full">{t('free')}</span>
            )}
          </div>
        </Card>

        {/* Budget */}
        <Card title={t('budgetSettings')}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('monthlyBudget')}</label>
            <div className="flex items-center gap-2">
              <input type="number" inputMode="decimal" value={monthlyLimit}
                onChange={e => setMonthlyLimit(e.target.value)} placeholder="2000"
                className="flex-1 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2.5 text-sm text-right outline-none focus:border-teal-500 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-sm text-gray-400 shrink-0">EGP</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('resetDay')}</label>
            <select value={resetDay} onChange={e => setResetDay(Number(e.target.value))}
              className="w-full border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-500 transition bg-white">
              {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>{ARABIC_ORDINALS[d]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t('warningAt')}{" "}<span className="text-teal-600 font-bold">{warnThreshold}%</span>
            </label>
            <input type="range" min={50} max={95} step={5} value={warnThreshold}
              onChange={e => setWarnThreshold(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
              style={{ background: `linear-gradient(to right, #14b8a6 ${((warnThreshold-50)/45)*100}%, #e5e7eb ${((warnThreshold-50)/45)*100}%)` }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>50%</span><span>95%</span>
            </div>
          </div>

          <button onClick={saveBudget} disabled={savingBudget}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2">
            {savingBudget ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('saving')}</> : t('saveSettings')}
          </button>
        </Card>

        {/* Preferences */}
        <Card title={t('preferences')}>

          {/* Language */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('language')}</p>
            <div className="flex gap-2">
              {(["ar", "en"] as const).map(lang => (
                <button key={lang} onClick={() => setLanguage(lang)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border-2 transition
                    ${language === lang
                      ? "bg-teal-600 border-teal-600 text-white"
                      : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-teal-300"}`}>
                  {lang === "ar" ? "العربية" : "English"}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('theme')}</p>
            <div className="flex gap-2">
              {([
                { val: "light",  label: t('light'),  emoji: "☀️" },
                { val: "dark",   label: t('dark'),   emoji: "🌙" },
                { val: "system", label: t('system'), emoji: "⚙️" },
              ] as const).map(th => (
                <button key={th.val} onClick={() => saveTheme(th.val)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition flex flex-col items-center gap-0.5
                    ${themeState === th.val
                      ? "bg-teal-600 border-teal-600 text-white"
                      : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-teal-300"}`}>
                  <span className="text-base">{th.emoji}</span>
                  <span>{th.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notifications */}
          {/* Notifications */}
<div>
  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
    {t('notifications')}
  </p>
  {notifPermission === "granted" ? (
    <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
      {t('notificationsEnabled')}
    </p>
  ) : notifPermission === "denied" ? (
    <p className="text-sm text-gray-500 dark:text-gray-400">
      {t('notificationsDenied')}
    </p>
  ) : (
    <button
      onClick={handleRequestNotif}
      className="w-full border-2 border-teal-500 text-teal-600 dark:text-teal-400
                 font-semibold py-2.5 rounded-xl text-sm
                 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition"
    >
      {t('enableNotifications')}
    </button>
  )}
</div>
        </Card>

        {/* Data */}
        <Card title={t('data')}>
          <button onClick={exportCSV} disabled={exporting}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-teal-400 transition">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              {exporting ? t('saving') : t('exportMonth')}
            </span>
            <Download size={18} className="text-teal-600" />
          </button>
          <button onClick={() => setShowDelete(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-red-200 hover:border-red-400 transition">
            <span className="text-sm font-semibold text-red-500">{t('deleteAllData')}</span>
            <Trash2 size={18} className="text-red-400" />
          </button>
        </Card>

        {/* Account */}
        <Card title={t('account')}>
          <button onClick={handleSignOut} disabled={signingOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-semibold text-sm">
            <LogOut size={16} />
            {signingOut ? "..." : t('signOut')}
          </button>
        </Card>

        {/* About */}
        <Card title={t('aboutApp')}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('appVersion')}</span>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">1.0.0</span>
          </div>
          <button onClick={() => setShowFeedback(true)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-teal-400 transition">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t('sendFeedback')}</span>
            <MessageSquare size={18} className="text-teal-600" />
          </button>
        </Card>

      </div>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      {showDelete   && <DeleteModal onClose={() => setShowDelete(false)} onConfirmed={deleteAllData} />}
    </Layout>
  );
}