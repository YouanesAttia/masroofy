export interface Expense {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  note?: string;
  is_recurring: boolean;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  monthly_limit: number;
  reset_day: number;
  warning_threshold: number;
}

export interface Category {
  id: string;
  name_en: string;
  name_ar: string;
  icon: string;
  color: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro";
  language: "ar" | "en";
  theme: "light" | "dark" | "system";
}