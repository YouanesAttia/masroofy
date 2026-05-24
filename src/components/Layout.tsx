import { NavLink } from "react-router-dom";
import { House, List, BarChart2, Settings, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Header from "./Header";
import type { ReactNode } from "react";

function BottomNav() {
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { to: "/",         icon: House,     label: t('home')     },
    { to: "/history",  icon: List,      label: t('history')  },
    { to: "/insights", icon: BarChart2, label: t('insights') },
    { to: "/settings", icon: Settings,  label: t('settings') },
  ] as const;

  return (
    <nav className="
      md:hidden fixed bottom-0 left-0 right-0 z-30
      h-16 bg-white dark:bg-gray-900
      border-t border-gray-200 dark:border-gray-700
      flex items-center
    ">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors
             ${isActive
               ? "text-teal-600 dark:text-teal-400"
               : "text-gray-400 dark:text-gray-500"}`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function Sidebar() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { to: "/",         icon: House,     label: t('home')     },
    { to: "/history",  icon: List,      label: t('history')  },
    { to: "/insights", icon: BarChart2, label: t('insights') },
    { to: "/settings", icon: Settings,  label: t('settings') },
  ] as const;

  return (
    <aside className="
      hidden md:flex fixed top-0 left-0 bottom-0 z-30
      w-60 bg-white dark:bg-gray-900
      border-r border-gray-200 dark:border-gray-700
      flex-col
    ">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
        <span className="text-2xl font-bold text-teal-600">مصروفي</span>
        <p className="text-xs text-gray-400 mt-0.5">Expense Tracker</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition
               ${isActive
                 ? "bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400"
                 : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-400 truncate mb-2 px-1">{user?.email}</p>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl
                     text-sm text-gray-500 dark:text-gray-400
                     hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition"
        >
          <LogOut size={16} />
          <span>{t('signOut')}</span>
        </button>
      </div>
    </aside>
  );
}

interface LayoutProps {
  children: ReactNode;
  title: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const { language } = useLanguage();

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
    >
      <Sidebar />
      <Header title={title} />
      <main className="md:ml-60 pt-14 md:pt-0 pb-16 md:pb-0 min-h-screen">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}