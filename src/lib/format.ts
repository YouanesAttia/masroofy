const ARABIC_MONTHS = [
  "يناير","فبراير","مارس","أبريل","مايو","يونيو",
  "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر",
];
const ARABIC_DAYS = [
  "الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت",
];

export function formatEGP(amount: number): string {
  return `${amount.toLocaleString("ar-EG")} EGP`;
}

export function formatArabicDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day  = ARABIC_DAYS[d.getDay()];
  const date = d.getDate();
  const mon  = ARABIC_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day}، ${date} ${mon} ${year}`;
}

export function formatMonthYear(year: number, month: number): string {
  return `${ARABIC_MONTHS[month - 1]} ${year}`;
}

export function formatTimeAgo(dateStr: string): string {
  const now   = new Date();
  const date  = new Date(dateStr + "T00:00:00");
  const diffMs   = now.getTime() - date.getTime();
  const diffMins  = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays  = Math.floor(diffMs / 86400000);

  if (diffMins  < 1)  return "الآن";
  if (diffMins  < 60) return `منذ ${diffMins} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays === 1) return "أمس";
  if (diffDays  < 7)  return `منذ ${diffDays} أيام`;
  if (diffDays  < 30) return `منذ ${Math.floor(diffDays / 7)} أسابيع`;
  return `منذ ${Math.floor(diffDays / 30)} شهر`;
}

export function formatDateHeader(dateStr: string): string {
  const today = new Date().toISOString().split("T")[0];
  const yest  = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateStr === today) return "اليوم";
  if (dateStr === yest)  return "أمس";
  const d = new Date(dateStr + "T00:00:00");
  return `${ARABIC_DAYS[d.getDay()]}، ${d.getDate()} ${ARABIC_MONTHS[d.getMonth()]}`;
}