import { useEffect, useState } from "react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => setIsOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online",  goOnline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online",  goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      className="
        fixed top-0 left-0 right-0 z-[100]
        bg-amber-400 text-amber-900
        px-4 py-2
        flex items-center justify-center
        text-sm font-semibold
        shadow-md
      "
      dir="rtl"
    >
      ⚠️ لا يوجد إنترنت — بعض المميزات غير متاحة
    </div>
  );
}