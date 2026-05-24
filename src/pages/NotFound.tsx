import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-sm">
        {/* 404 number */}
        <h1 className="text-8xl font-black text-teal-600 leading-none">
          404
        </h1>

        {/* Arabic message */}
        <div className="space-y-2">
          <p className="text-xl font-bold text-gray-900 dark:text-white" dir="rtl">
            الصفحة غير موجودة
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm" dir="rtl">
            الرابط الذي تبحث عنه غير موجود أو تم نقله.
          </p>
        </div>

        {/* Back home */}
        <button
          onClick={() => navigate("/")}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-2xl text-sm transition active:scale-95"
          dir="rtl"
        >
          العودة للرئيسية
        </button>
      </div>
    </div>
  );
}