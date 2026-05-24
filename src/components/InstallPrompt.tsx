import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible,     setVisible]     = useState(false);

  useEffect(() => {
    // Don't show if already dismissed
    if (localStorage.getItem("install-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("install-dismissed", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="
        fixed bottom-20 left-4 right-4 z-50
        md:left-auto md:right-6 md:w-80
        bg-white dark:bg-gray-800
        rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700
        px-4 py-3
        flex items-center gap-3
        animate-fade-in
      "
      dir="rtl"
    >
      {/* Icon */}
      <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white text-xl shrink-0">
        م
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 dark:text-white">
          📲 أضف مصروفي
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          أضفه لشاشتك الرئيسية
        </p>
      </div>

      {/* Install button */}
      <button
        onClick={handleInstall}
        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shrink-0"
      >
        تثبيت
      </button>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="p-1 text-gray-400 hover:text-gray-600 transition shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}