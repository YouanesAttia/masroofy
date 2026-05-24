import { Bell } from "lucide-react";

interface HeaderProps { title: string }

export default function Header({ title }: HeaderProps) {
  return (
    <header className="
      md:hidden fixed top-0 left-0 right-0 z-30 h-14
      bg-white dark:bg-gray-900
      border-b border-gray-200 dark:border-gray-700
      flex items-center justify-between px-4
    ">
      <h1 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h1>
      <button
        aria-label="Notifications"
        className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
      >
        <Bell size={20} />
      </button>
    </header>
  );
}