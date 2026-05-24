import { getRoast } from './roastMessages';

// ── Permission ────────────────────────────────────────────────
export async function requestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied')  return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// ── Send a notification ───────────────────────────────────────
export function sendNotification(
  title: string,
  body: string,
  tag = 'masroofy-alert'
): void {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon:  '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag,
      dir: 'auto',
      lang: 'ar',
    });
  } catch {
    // Some browsers block Notification constructor outside SW context
  }
}

// ── Combined check + roast notify ─────────────────────────────
export function checkAndNotify(params: {
  spent: number;
  limit: number;
  threshold: number;
  lastExpenseAmount: number;
  language: 'ar' | 'en';
}): void {
  const { spent, limit, threshold, lastExpenseAmount, language } = params;
  if (limit <= 0) return;

  const percent = (spent / limit) * 100;
  const tag = 'budget-status';

  if (spent > limit) {
    sendNotification(
      language === 'ar' ? '🔴 تجاوزت الميزانية' : '🔴 Budget Exceeded',
      getRoast('exceeded', language),
      tag
    );
    return;
  }

  if (percent >= threshold) {
    sendNotification(
      language === 'ar'
        ? `⚠️ ${Math.round(percent)}% من ميزانيتك`
        : `⚠️ ${Math.round(percent)}% of budget used`,
      getRoast('warning', language),
      tag
    );
    return;
  }

  if (lastExpenseAmount > limit * 0.2) {
    sendNotification(
      language === 'ar' ? '💸 مصروف كبير!' : '💸 Big spend!',
      getRoast('bigSpend', language),
      'big-spend'
    );
    return;
  }

  // Occasional encouragement — 1 in 5 chance to avoid being annoying
  if (Math.random() < 0.2 && percent < 60) {
    sendNotification(
      language === 'ar' ? '✅ ماشي تمام!' : '✅ Looking good!',
      getRoast('onTrack', language),
      'on-track'
    );
  }
}

// ── Legacy helpers kept for backward compatibility ────────────
export function checkBudgetWarning(spent: number, limit: number, threshold: number): void {
  if (limit <= 0) return;
  const pct = (spent / limit) * 100;
  if (pct >= threshold && pct < 100) {
    sendNotification(
      'تنبيه ميزانية مصروفي',
      `تنبيه: لقد صرفت ${Math.round(pct)}% من ميزانيتك هذا الشهر`
    );
  }
}

export function checkBudgetExceeded(spent: number, limit: number): void {
  if (limit <= 0) return;
  if (spent > limit) {
    sendNotification(
      'تجاوزت ميزانيتك! — مصروفي',
      `لقد تجاوزت ميزانيتك الشهرية بـ ${(spent - limit).toLocaleString('ar-EG')} جنيه`
    );
  }
}